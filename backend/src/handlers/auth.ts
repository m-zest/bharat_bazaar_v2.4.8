import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { success, error } from '../utils/response';
import { putItem, getItem } from '../utils/dynamodb-client';
import { sendNotification } from '../utils/notification-service';

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

const CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

// Route requests based on path
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const path = event.path || '';
  const method = event.httpMethod;

  try {
    if (path.endsWith('/register') && method === 'POST') return await register(event);
    if (path.endsWith('/login') && method === 'POST') return await login(event);
    if (path.endsWith('/confirm') && method === 'POST') return await confirmEmail(event);
    if (path.endsWith('/forgot-password') && method === 'POST') return await forgotPassword(event);
    if (path.endsWith('/reset-password') && method === 'POST') return await resetPassword(event);
    if (path.endsWith('/profile') && method === 'GET') return await getProfile(event);
    if (path.endsWith('/profile-update') && method === 'PUT') return await updateProfile(event);

    return error(404, 'Route not found', 'NOT_FOUND');
  } catch (err: any) {
    console.error('Auth handler error:', err);
    return error(500, err.message || 'Internal server error');
  }
}

// POST /api/auth/register
async function register(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const { password, fullName, businessName, city, businessCategory } = body;
  const email = (body.email || '').toLowerCase().trim();

  if (!email || !password) {
    return error(400, 'Missing required fields: email, password', 'INVALID_REQUEST');
  }

  const userAttributes = [
    { Name: 'email', Value: email },
  ];
  if (fullName) userAttributes.push({ Name: 'name', Value: fullName });
  if (businessName) userAttributes.push({ Name: 'custom:businessName', Value: businessName });
  if (city) userAttributes.push({ Name: 'custom:city', Value: city });
  if (businessCategory) userAttributes.push({ Name: 'custom:businessCategory', Value: businessCategory });

  const result = await cognito.send(new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: userAttributes,
  }));

  // Send welcome notification
  sendNotification({
    type: 'USER_REGISTERED',
    userId: result.UserSub || '',
    email,
    businessName,
  }).catch(() => {});

  return success({
    message: 'Registration successful. Check your email for verification code.',
    userId: result.UserSub,
    confirmed: result.UserConfirmed,
  });
}

// POST /api/auth/confirm
async function confirmEmail(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const email = (body.email || '').toLowerCase().trim();
  const { code } = body;

  if (!email || !code) {
    return error(400, 'Missing required fields: email, code', 'INVALID_REQUEST');
  }

  await cognito.send(new ConfirmSignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  }));

  return success({ message: 'Email verified successfully. You can now login.' });
}

// POST /api/auth/forgot-password
async function forgotPassword(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const email = (body.email || '').toLowerCase().trim();

  if (!email) {
    return error(400, 'Missing required field: email', 'INVALID_REQUEST');
  }

  await cognito.send(new ForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
  }));

  return success({ message: 'Password reset code sent to your email.' });
}

// POST /api/auth/reset-password
async function resetPassword(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const email = (body.email || '').toLowerCase().trim();
  const { code, newPassword } = body;

  if (!email || !code || !newPassword) {
    return error(400, 'Missing required fields: email, code, newPassword', 'INVALID_REQUEST');
  }

  await cognito.send(new ConfirmForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  }));

  return success({ message: 'Password reset successful. You can now login with your new password.' });
}

// POST /api/auth/login
async function login(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || '{}');
  const email = (body.email || '').toLowerCase().trim();
  const { password } = body;

  if (!email || !password) {
    return error(400, 'Missing required fields: email, password', 'INVALID_REQUEST');
  }

  const result = await cognito.send(new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  }));

  const auth = result.AuthenticationResult;
  if (!auth) {
    return error(401, 'Authentication failed', 'AUTH_FAILED');
  }

  return success({
    accessToken: auth.AccessToken,
    refreshToken: auth.RefreshToken,
    idToken: auth.IdToken,
    expiresIn: auth.ExpiresIn,
  });
}

// GET /api/auth/profile
async function getProfile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = getUserId(event);
  if (!userId) return error(401, 'Unauthorized', 'UNAUTHORIZED');

  const item = await getItem(`USER#${userId}`, 'PROFILE');

  if (!item) {
    return success({
      userId,
      profile: null,
      message: 'No profile found. Create one by updating your profile.',
    });
  }

  return success(item.Data || item);
}

// PUT /api/auth/profile-update
async function updateProfile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = getUserId(event);
  if (!userId) return error(401, 'Unauthorized', 'UNAUTHORIZED');

  const body = JSON.parse(event.body || '{}');
  const { businessName, city, businessCategory, preferences } = body;

  const profileData = {
    userId,
    businessName,
    city,
    businessCategory,
    preferences,
    updatedAt: new Date().toISOString(),
  };

  await putItem({
    PK: `USER#${userId}`,
    SK: 'PROFILE',
    EntityType: 'UserProfile',
    GSI1PK: `BUSINESS_TYPE#${businessCategory || 'general'}`,
    GSI1SK: `USER#${userId}`,
    GSI2PK: `REGION#${city || 'unknown'}`,
    GSI2SK: `USER#${userId}`,
    Data: profileData,
  });

  return success(profileData);
}

// Extract userId from Cognito authorizer or mock header
function getUserId(event: APIGatewayProxyEvent): string | null {
  // From Cognito authorizer (API Gateway)
  const claims = event.requestContext?.authorizer?.claims;
  if (claims?.sub) return claims.sub;

  // From mock header (local development)
  const mockUserId = event.headers?.['x-mock-user-id'];
  if (mockUserId) return mockUserId;

  return null;
}
