// Gemini 1.5 Flash client — used as primary AI backend (Bedrock broken for hackathon)

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function callGemini(prompt: string, options: { temperature?: number; maxOutputTokens?: number } = {}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No GEMINI_API_KEY');

  const { temperature = 0.7, maxOutputTokens = 1024 } = options;

  const response = await fetch(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens },
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API error: ${response.status} ${errText}`);
  }

  const data: any = await response.json();
  return data.candidates[0].content.parts[0].text;
}

export async function callGeminiVision(
  prompt: string,
  imageBase64: string,
  mimeType: string,
  options: { temperature?: number; maxOutputTokens?: number } = {},
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No GEMINI_API_KEY');

  const { temperature = 0.3, maxOutputTokens = 2048 } = options;

  const response = await fetch(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature, maxOutputTokens },
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini Vision error: ${response.status} ${errText}`);
  }

  const data: any = await response.json();
  return data.candidates[0].content.parts[0].text;
}
