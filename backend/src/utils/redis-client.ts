import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'BharatBazaarData';

const rawClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

const cacheClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: { removeUndefinedValues: true },
});

/**
 * Get cached value by key. Returns parsed data or null on miss/error.
 * Uses DynamoDB with TTL for automatic expiry.
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    const result = await cacheClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CACHE#${key}`, SK: 'CACHED_RESPONSE' },
    }));

    if (!result.Item) return null;

    // Check if TTL has expired (DynamoDB TTL cleanup can be delayed up to 48h)
    const now = Math.floor(Date.now() / 1000);
    if (result.Item.TTL && result.Item.TTL < now) return null;

    console.log(`Cache HIT: ${key}`);
    return result.Item.Data as T;
  } catch (err: any) {
    console.warn(`Cache GET error for ${key}:`, err.message);
    return null;
  }
}

/**
 * Store value in cache with TTL (seconds).
 * Uses DynamoDB TTL attribute for automatic expiry.
 */
export async function setCache(key: string, data: any, ttlSeconds: number): Promise<void> {
  try {
    const now = Math.floor(Date.now() / 1000);
    await cacheClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `CACHE#${key}`,
        SK: 'CACHED_RESPONSE',
        EntityType: 'Cache',
        Data: data,
        TTL: now + ttlSeconds,
        CachedAt: new Date().toISOString(),
      },
    }));
    console.log(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (err: any) {
    console.warn(`Cache SET error for ${key}:`, err.message);
  }
}

// --- Cache key builders ---

export function pricingCacheKey(product: string, city: string, costPrice: number): string {
  return `PRICING:${product.toLowerCase()}:${city.toLowerCase()}:${costPrice}`;
}

export function descriptionCacheKey(product: string, languages: string[]): string {
  const sortedLangs = [...languages].sort().join(',');
  return `DESC:${product.toLowerCase()}:${sortedLangs}`;
}

export function sentimentCacheKey(product: string, reviewCount: number): string {
  return `SENTIMENT:${product.toLowerCase()}:${reviewCount}`;
}
