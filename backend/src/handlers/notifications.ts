import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, error } from '../utils/response';
import { getItem, putItem, queryItems } from '../utils/dynamodb-client';
import { sendNotification } from '../utils/notification-service';

// Route requests based on path and method
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const path = event.path || '';
  const method = event.httpMethod;

  try {
    // API Gateway routes
    if (path.endsWith('/preferences') && method === 'GET') return await getPreferences(event);
    if (path.endsWith('/preferences') && method === 'PUT') return await updatePreferences(event);

    // EventBridge trigger (weekly digest) — no path, comes from scheduled event
    if (!path && (event as any).source === 'aws.events') return await sendWeeklyDigest();

    return error(404, 'Route not found', 'NOT_FOUND');
  } catch (err: any) {
    console.error('Notifications handler error:', err);
    return error(500, err.message || 'Internal server error');
  }
}

// Also export for EventBridge direct invocation
export async function weeklyDigestHandler(): Promise<void> {
  await sendWeeklyDigest();
}

function getUserId(event: APIGatewayProxyEvent): string | null {
  return event.requestContext?.authorizer?.claims?.sub
    || event.headers?.['x-mock-user-id']
    || null;
}

// GET /api/notifications/preferences
async function getPreferences(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = getUserId(event);
  if (!userId) return error(401, 'Unauthorized', 'UNAUTHORIZED');

  const profile = await getItem(`USER#${userId}`, 'PROFILE');
  const notifications = profile?.Data?.preferences?.notifications || {
    email: true,
    sms: false,
    pricingAlerts: true,
    sentimentAlerts: true,
    contentReady: true,
    weeklyDigest: true,
  };

  return success({ userId, notifications });
}

// PUT /api/notifications/preferences
async function updatePreferences(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = getUserId(event);
  if (!userId) return error(401, 'Unauthorized', 'UNAUTHORIZED');

  const body = JSON.parse(event.body || '{}');
  const { email, sms, pricingAlerts, sentimentAlerts, contentReady, weeklyDigest } = body;

  // Get existing profile
  const profile = await getItem(`USER#${userId}`, 'PROFILE');
  const existingData = profile?.Data || {};

  const updatedPreferences = {
    ...existingData.preferences,
    notifications: {
      email: email ?? true,
      sms: sms ?? false,
      pricingAlerts: pricingAlerts ?? true,
      sentimentAlerts: sentimentAlerts ?? true,
      contentReady: contentReady ?? true,
      weeklyDigest: weeklyDigest ?? true,
    },
  };

  await putItem({
    PK: `USER#${userId}`,
    SK: 'PROFILE',
    EntityType: 'UserProfile',
    GSI1PK: existingData.GSI1PK || `BUSINESS_TYPE#general`,
    GSI1SK: `USER#${userId}`,
    Data: {
      ...existingData,
      preferences: updatedPreferences,
      updatedAt: new Date().toISOString(),
    },
  });

  return success({ notifications: updatedPreferences.notifications });
}

// Weekly digest — triggered by EventBridge every Monday 8 AM IST
async function sendWeeklyDigest(): Promise<APIGatewayProxyResult> {
  console.log('Starting weekly digest...');

  // Query all user profiles
  const users = await queryItems('BUSINESS_TYPE#general', undefined, 100);

  let sent = 0;
  for (const user of users) {
    const userId = user.Data?.userId;
    const notifications = user.Data?.preferences?.notifications;

    if (!userId || notifications?.weeklyDigest === false) continue;

    // Count this week's activity
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const pricingItems = await queryItems(`PRICING#`, `TIMESTAMP#${oneWeekAgo}`, 100);
    const sentimentItems = await queryItems(`SENTIMENT#`, `TIMESTAMP#${oneWeekAgo}`, 100);

    await sendNotification({
      type: 'WEEKLY_DIGEST',
      userId,
      email: user.Data?.email,
      pricingCount: pricingItems.length,
      sentimentCount: sentimentItems.length,
      contentCount: 0,
    }).catch(() => {});

    sent++;
  }

  console.log(`Weekly digest sent to ${sent} users`);
  return success({ message: `Weekly digest sent to ${sent} users` });
}
