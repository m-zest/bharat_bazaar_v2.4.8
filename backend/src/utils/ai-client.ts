import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL_ID = process.env.GEMINI_MODEL_ID || 'gemini-2.0-flash';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey');
    }
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

export interface AIOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Invoke AI model — currently Google Gemini (free tier).
 * Drop-in interface: swap to Bedrock later by changing this one file.
 */
export async function invokeAI(
  prompt: string,
  options: AIOptions = {}
): Promise<string> {
  const { maxTokens = 4000, temperature = 0.3, systemPrompt } = options;

  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL_ID,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

/**
 * Extract JSON from AI response — handles markdown code blocks and raw JSON.
 */
export function parseJSONResponse<T>(text: string): T {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1].trim());
  }
  return JSON.parse(text);
}
