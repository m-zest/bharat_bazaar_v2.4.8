import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { invokeAI, parseJSONResponse } from '../utils/ai-client';
import { success, error } from '../utils/response';
import { buildDescriptionPrompt } from '../prompts/description-prompt';
import { putItem } from '../utils/dynamodb-client';
import { sendNotification } from '../utils/notification-service';
import { getCache, setCache, descriptionCacheKey } from '../utils/redis-client';

export interface DescriptionRequest {
  productName: string;
  category: string;
  features: string[];
  specifications: Record<string, string>;
  targetLanguages: string[];
  tone?: string;
  targetAudience?: string;
}

export interface DescriptionResponse {
  descriptions: {
    language: string;
    languageName: string;
    title: string;
    description: string;
    bulletPoints: string[];
    culturalNotes: string;
    localSearchTerms: string[];
  }[];
  seoKeywords: {
    language: string;
    keywords: string[];
  }[];
}

const VALID_LANGUAGES = ['en', 'hi', 'ta', 'bn', 'gu', 'mr'];

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body: DescriptionRequest = JSON.parse(event.body || '{}');

    if (!body.productName || !body.category || !body.features?.length || !body.targetLanguages?.length) {
      return error(400, 'Missing required fields: productName, category, features, targetLanguages', 'INVALID_REQUEST');
    }

    const invalidLangs = body.targetLanguages.filter(l => !VALID_LANGUAGES.includes(l));
    if (invalidLangs.length > 0) {
      return error(400, `Unsupported languages: ${invalidLangs.join(', ')}. Supported: ${VALID_LANGUAGES.join(', ')}`, 'INVALID_REQUEST');
    }

    // Check Redis cache before calling AI
    const cacheKey = descriptionCacheKey(body.productName, body.targetLanguages);
    const cached = await getCache(cacheKey);
    if (cached) {
      return success({ ...cached, fromCache: true });
    }

    const prompt = buildDescriptionPrompt({
      productName: body.productName,
      category: body.category,
      features: body.features,
      specifications: body.specifications || {},
      targetLanguages: body.targetLanguages,
      tone: body.tone || 'persuasive',
      targetAudience: body.targetAudience,
    });

    const aiResponse = await invokeAI(prompt, {
      maxTokens: 2000 * body.targetLanguages.length,
      temperature: 0.6,
      systemPrompt: 'You are BharatBazaar AI Content Generator. Create culturally adapted, multilingual product descriptions for Indian e-commerce. You are fluent in Hindi, Tamil, Bengali, Gujarati, Marathi, and English. Always respond in valid JSON. Write actual text in the target languages, not transliterations.',
    });

    const result = parseJSONResponse<DescriptionResponse>(aiResponse);

    const responseData = {
      ...result,
      productName: body.productName,
      generatedAt: new Date().toISOString(),
    };

    // Extract userId from Cognito authorizer (or mock for local dev)
    const userId = event.requestContext?.authorizer?.claims?.sub
      || event.headers?.['x-mock-user-id']
      || 'anonymous';

    // Cache AI response in Redis (7 days)
    await setCache(cacheKey, responseData, 604800);

    // Persist to DynamoDB (non-blocking)
    for (const desc of result.descriptions || []) {
      putItem({
        PK: `CONTENT#${body.productName}`,
        SK: `LANGUAGE#${desc.language}#${new Date().toISOString()}`,
        EntityType: 'GeneratedContent',
        UserId: userId,
        GSI1PK: `PRODUCT#${body.productName}`,
        GSI1SK: `LANGUAGE#${desc.language}`,
        Data: desc,
      }).catch(() => {});
    }

    // Notify that content is ready
    const languages = (result.descriptions || []).map(d => d.languageName).join(', ');
    sendNotification({
      type: 'CONTENT_READY',
      userId,
      productName: body.productName,
      languages,
    }).catch(() => {});

    return success(responseData);
  } catch (err: any) {
    console.error('Description handler error:', err);
    return error(500, err.message || 'Internal server error');
  }
}
