import { parseJSONResponse, cleanJsonResponse, BedrockThrottleError } from '../utils/bedrock-client';

// We test parseJSONResponse, cleanJsonResponse, and BedrockThrottleError directly.
// invokeBedrockClaude requires AWS SDK / Gemini mocking and is tested indirectly via handler tests.

describe('bedrock-client utilities', () => {
  describe('cleanJsonResponse()', () => {
    it('strips ```json wrapper from Gemini responses', () => {
      const text = '```json\n{"price": 100}\n```';
      expect(cleanJsonResponse(text)).toBe('{"price": 100}');
    });

    it('strips unlabeled ``` wrapper', () => {
      const text = '```\n{"a": 1}\n```';
      expect(cleanJsonResponse(text)).toBe('{"a": 1}');
    });

    it('returns plain JSON unchanged', () => {
      expect(cleanJsonResponse('{"x": 42}')).toBe('{"x": 42}');
    });
  });

  describe('parseJSONResponse()', () => {
    it('parses plain JSON', () => {
      const result = parseJSONResponse<{ x: number }>('{"x": 42}');
      expect(result).toEqual({ x: 42 });
    });

    it('extracts JSON from markdown code blocks (Gemini format)', () => {
      const text = '```json\n{"price": 100}\n```';
      const result = parseJSONResponse<{ price: number }>(text);
      expect(result.price).toBe(100);
    });

    it('extracts JSON from unlabeled code blocks', () => {
      const text = '```\n{"a": 1}\n```';
      const result = parseJSONResponse<{ a: number }>(text);
      expect(result.a).toBe(1);
    });

    it('extracts JSON object from mixed text', () => {
      const text = 'Sure, here is the analysis: {"score": 85} Hope that helps!';
      const result = parseJSONResponse<{ score: number }>(text);
      expect(result.score).toBe(85);
    });

    it('throws on invalid JSON', () => {
      expect(() => parseJSONResponse('not json at all')).toThrow();
    });
  });

  describe('BedrockThrottleError', () => {
    it('sets isDailyQuota=true with long retry for quota errors', () => {
      const err = new BedrockThrottleError('daily limit', true);
      expect(err.isDailyQuota).toBe(true);
      expect(err.retryAfterMs).toBe(3600000); // 1 hour
      expect(err.name).toBe('BedrockThrottleError');
      expect(err).toBeInstanceOf(Error);
    });

    it('sets isDailyQuota=false with short retry for burst errors', () => {
      const err = new BedrockThrottleError('too fast', false);
      expect(err.isDailyQuota).toBe(false);
      expect(err.retryAfterMs).toBe(60000); // 1 minute
    });
  });
});
