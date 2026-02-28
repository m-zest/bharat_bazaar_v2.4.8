import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Primary client (ap-south-1)
const primaryClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

// Fallback client (us-east-1) for cross-region attempts
const usEastClient = new BedrockRuntimeClient({
  region: 'us-east-1',
});

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';

// Fallback model chain — tried in order
const MODEL_CHAIN = [
  { client: primaryClient, modelId: MODEL_ID, label: 'ap-south-1/Haiku' },
  { client: usEastClient, modelId: 'us.anthropic.claude-3-haiku-20240307-v1:0', label: 'us-east-1/Haiku-cross-region' },
  { client: usEastClient, modelId: 'amazon.nova-lite-v1:0', label: 'us-east-1/Nova-Lite', isNova: true },
];

export interface BedrockOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

// Custom error class for throttling so handlers can detect it
export class BedrockThrottleError extends Error {
  public readonly isDailyQuota: boolean;
  public readonly retryAfterMs: number;

  constructor(message: string, isDailyQuota: boolean) {
    super(message);
    this.name = 'BedrockThrottleError';
    this.isDailyQuota = isDailyQuota;
    this.retryAfterMs = isDailyQuota ? 3600000 : 60000;
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isThrottleError(err: any): boolean {
  return err.name === 'ThrottlingException' ||
    err.message?.includes('Too many') ||
    err.message?.includes('throttl') ||
    err.$metadata?.httpStatusCode === 429;
}

function isDailyQuotaError(err: any): boolean {
  return err.message?.includes('per day') ||
    err.message?.includes('daily') ||
    err.message?.includes('quota');
}

function isAccessError(err: any): boolean {
  return err.name === 'AccessDeniedException' ||
    err.name === 'ValidationException' ||
    err.message?.includes('no access') ||
    err.message?.includes('not authorized') ||
    err.message?.includes('is not supported') ||
    err.$metadata?.httpStatusCode === 403;
}

async function tryInvoke(
  bedrockClient: BedrockRuntimeClient,
  modelId: string,
  body: string,
  label: string,
  isNova?: boolean,
): Promise<string> {
  let requestBody: string;

  if (isNova) {
    // Amazon Nova uses a different request format
    const parsed = JSON.parse(body);
    requestBody = JSON.stringify({
      inferenceConfig: {
        max_new_tokens: parsed.max_tokens,
        temperature: parsed.temperature,
      },
      messages: [
        {
          role: 'user',
          content: [{ text: `${parsed.system}\n\n${parsed.messages[0].content}` }],
        },
      ],
    });
  } else {
    requestBody = body;
  }

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: new TextEncoder().encode(requestBody),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  if (isNova) {
    return responseBody.output?.message?.content?.[0]?.text || JSON.stringify(responseBody);
  }
  return responseBody.content[0].text;
}

export async function invokeBedrockClaude(
  prompt: string,
  options: BedrockOptions = {}
): Promise<string> {
  const { maxTokens = 2000, temperature = 0.3, systemPrompt } = options;

  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt || 'You are BharatBazaar AI, an expert market intelligence assistant for Indian retail. Always respond in valid JSON format.',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Try each model in the chain
  for (const { client: bedrockClient, modelId, label, isNova } of MODEL_CHAIN) {
    // Retry with exponential backoff for burst rate limiting
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Trying ${label} (attempt ${attempt + 1})`);
        const result = await tryInvoke(bedrockClient, modelId, body, label, isNova);
        console.log(`Success with ${label}`);
        return result;
      } catch (err: any) {
        // Access denied or model not available — skip to next model
        if (isAccessError(err)) {
          console.log(`${label}: Access denied or not available, trying next model...`);
          break; // Move to next model in chain
        }

        if (isThrottleError(err)) {
          const dailyQuota = isDailyQuotaError(err);
          if (dailyQuota) {
            console.log(`${label}: Daily quota exceeded, trying next model...`);
            break; // Move to next model in chain
          }

          // Burst rate limit — retry with backoff
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt + 1) * 1000;
            console.log(`${label}: Throttled (burst), retrying in ${delay}ms`);
            await sleep(delay);
            continue;
          }

          // Exhausted retries — try next model
          console.log(`${label}: Exhausted retries, trying next model...`);
          break;
        }

        // Other error — try next model
        console.log(`${label}: Error ${err.message}, trying next model...`);
        break;
      }
    }
  }

  // All models failed — throw so handler catches and uses demo fallback
  throw new Error('All Bedrock models unavailable — demo fallback will be used');
}

export function parseJSONResponse<T>(text: string): T {
  // Try to extract JSON from the response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1].trim());
  }
  return JSON.parse(text);
}
