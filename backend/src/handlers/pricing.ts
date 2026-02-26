import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { invokeAI, parseJSONResponse } from '../utils/ai-client';
import { success, error } from '../utils/response';
import { buildPricingPrompt } from '../prompts/pricing-prompt';
import { REGIONAL_DATA, getUpcomingFestivals } from '../data/regional-data';
import { COMPETITOR_PRICES } from '../data/sample-data';
import { putItem } from '../utils/dynamodb-client';
import { sendNotification } from '../utils/notification-service';
import { getCache, setCache, pricingCacheKey } from '../utils/redis-client';

export interface PricingRequest {
  productName: string;
  category: string;
  costPrice: number;
  currentPrice?: number;
  city: string;
}

export interface PricingResponse {
  recommendations: {
    strategy: string;
    suggestedPrice: number;
    confidenceScore: number;
    expectedImpact: {
      demandChange: string;
      revenueChange: string;
      monthlyProfitImpact: string;
    };
    reasoning: string;
  }[];
  marketContext: {
    averageCompetitorPrice: number;
    priceRange: { min: number; max: number };
    regionalPurchasingPower: number;
  };
  festivalInsight: string;
  keyTakeaway: string;
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body: PricingRequest = JSON.parse(event.body || '{}');

    if (!body.productName || !body.category || !body.costPrice || !body.city) {
      return error(400, 'Missing required fields: productName, category, costPrice, city', 'INVALID_REQUEST');
    }

    const regionData = REGIONAL_DATA[body.city];
    if (!regionData) {
      return error(400, `Unsupported city: ${body.city}. Supported: ${Object.keys(REGIONAL_DATA).join(', ')}`, 'INVALID_REQUEST');
    }

    const competitors = COMPETITOR_PRICES[body.productName as keyof typeof COMPETITOR_PRICES] || [
      { seller: 'Amazon', price: Math.round(body.costPrice * 1.5), rating: 4.0 },
      { seller: 'Flipkart', price: Math.round(body.costPrice * 1.4), rating: 3.8 },
      { seller: 'Local Market', price: Math.round(body.costPrice * 1.25), rating: null },
    ];

    const festivals = getUpcomingFestivals(body.city, 3);

    // Check Redis cache before calling AI
    const cacheKey = pricingCacheKey(body.productName, body.city, body.costPrice);
    const cached = await getCache(cacheKey);
    if (cached) {
      return success({ ...cached, fromCache: true });
    }

    const prompt = buildPricingPrompt({
      productName: body.productName,
      category: body.category,
      costPrice: body.costPrice,
      currentPrice: body.currentPrice,
      city: body.city,
      purchasingPowerIndex: regionData.purchasingPowerIndex,
      tier: regionData.tier,
      competitorPrices: competitors,
      upcomingFestivals: festivals,
      culturalPreferences: regionData.culturalPreferences,
    });

    const aiResponse = await invokeAI(prompt, {
      maxTokens: 3000,
      temperature: 0.4,
      systemPrompt: 'You are BharatBazaar AI Pricing Engine. Analyze Indian retail markets and provide pricing strategies. Always respond in valid JSON format. All prices must be in Indian Rupees (₹).',
    });

    const result = parseJSONResponse<PricingResponse>(aiResponse);

    const responseData = {
      ...result,
      productName: body.productName,
      city: body.city,
      region: regionData.tier,
      generatedAt: new Date().toISOString(),
    };

    // Extract userId from Cognito authorizer (or mock for local dev)
    const userId = event.requestContext?.authorizer?.claims?.sub
      || event.headers?.['x-mock-user-id']
      || 'anonymous';

    // Cache AI response in Redis (24 hours)
    await setCache(cacheKey, responseData, 86400);

    // Persist to DynamoDB (non-blocking, fails silently)
    putItem({
      PK: `PRICING#${body.city}#${body.category}`,
      SK: `TIMESTAMP#${new Date().toISOString()}`,
      EntityType: 'PricingRecommendation',
      UserId: userId,
      GSI1PK: `PRODUCT#${body.productName}`,
      GSI1SK: `TIMESTAMP#${new Date().toISOString()}`,
      Data: responseData,
    }).catch(() => {});

    // Notify if high-confidence recommendation
    const topRec = result.recommendations?.[0];
    if (topRec?.confidenceScore >= 80) {
      sendNotification({
        type: 'PRICING_ALERT',
        userId,
        productName: body.productName,
        suggestedPrice: topRec.suggestedPrice,
        confidence: topRec.confidenceScore,
        expectedImpact: topRec.expectedImpact?.revenueChange,
      }).catch(() => {});
    }

    return success(responseData);
  } catch (err: any) {
    console.error('Pricing handler error:', err);
    return error(500, err.message || 'Internal server error');
  }
}
