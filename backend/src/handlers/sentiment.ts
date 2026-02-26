import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { invokeAI, parseJSONResponse } from '../utils/ai-client';
import { success, error } from '../utils/response';
import { buildSentimentPrompt } from '../prompts/sentiment-prompt';
import { DEMO_REVIEWS } from '../data/sample-data';
import { putItem } from '../utils/dynamodb-client';
import { sendNotification } from '../utils/notification-service';
import { getCache, setCache, sentimentCacheKey } from '../utils/redis-client';

export interface SentimentRequest {
  productName: string;
  reviews?: {
    reviewId: string;
    text: string;
    language?: string;
    rating?: number;
    date: string;
  }[];
  useDemo?: boolean;
}

export interface SentimentResponse {
  overallSentiment: {
    score: number;
    label: string;
    distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  keyThemes: {
    theme: string;
    frequency: number;
    sentiment: number;
    exampleReviews: string[];
  }[];
  productAttributes: {
    attribute: string;
    sentiment: number;
    mentionCount: number;
    keyPhrases: string[];
  }[];
  actionableInsights: {
    category: string;
    priority: string;
    description: string;
    affectedReviewCount: number;
    suggestedAction: string;
  }[];
  languageBreakdown: {
    language: string;
    reviewCount: number;
    avgSentiment: number;
  }[];
  hinglishInsights: string;
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body: SentimentRequest = JSON.parse(event.body || '{}');

    if (!body.productName) {
      return error(400, 'Missing required field: productName', 'INVALID_REQUEST');
    }

    // Use demo reviews if requested or no reviews provided
    const reviews = (body.useDemo || !body.reviews?.length) ? DEMO_REVIEWS : body.reviews;

    if (!reviews.length) {
      return error(400, 'No reviews to analyze', 'INVALID_REQUEST');
    }

    // Check Redis cache before calling AI
    const cacheKey = sentimentCacheKey(body.productName, reviews.length);
    const cached = await getCache(cacheKey);
    if (cached) {
      return success({ ...cached, fromCache: true });
    }

    const prompt = buildSentimentPrompt({
      productName: body.productName,
      reviews,
    });

    const aiResponse = await invokeAI(prompt, {
      maxTokens: 4000,
      temperature: 0.2,
      systemPrompt: 'You are BharatBazaar AI Sentiment Analyzer. You are an expert at understanding Indian consumer reviews in Hindi, English, Hinglish (code-mixed), and other Indian languages. You detect nuanced sentiment including sarcasm, regional expressions, and cultural context. Always respond in valid JSON.',
    });

    const result = parseJSONResponse<SentimentResponse>(aiResponse);

    const responseData = {
      ...result,
      productName: body.productName,
      reviewCount: reviews.length,
      analyzedAt: new Date().toISOString(),
    };

    // Extract userId from Cognito authorizer (or mock for local dev)
    const userId = event.requestContext?.authorizer?.claims?.sub
      || event.headers?.['x-mock-user-id']
      || 'anonymous';

    // Cache AI response in Redis (24 hours)
    await setCache(cacheKey, responseData, 86400);

    // Persist to DynamoDB (non-blocking)
    putItem({
      PK: `SENTIMENT#${body.productName}`,
      SK: `TIMESTAMP#${new Date().toISOString()}`,
      EntityType: 'SentimentAnalysis',
      UserId: userId,
      GSI1PK: `PRODUCT#${body.productName}`,
      GSI1SK: `TIMESTAMP#${new Date().toISOString()}`,
      Data: responseData,
    }).catch(() => {});

    // Notify on negative sentiment spike
    if (result.overallSentiment?.label === 'negative' && result.overallSentiment?.score < -50) {
      sendNotification({
        type: 'SENTIMENT_ALERT',
        userId,
        productName: body.productName,
        sentiment: result.overallSentiment.label,
        score: result.overallSentiment.score,
        topComplaint: result.actionableInsights?.[0]?.description,
        affectedReviews: result.actionableInsights?.[0]?.affectedReviewCount,
      }).catch(() => {});
    }

    return success(responseData);
  } catch (err: any) {
    console.error('Sentiment handler error:', err);
    return error(500, err.message || 'Internal server error');
  }
}
