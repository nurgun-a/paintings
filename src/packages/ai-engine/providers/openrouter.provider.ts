import { LLMProvider, AIConfig, ChatMessageHistory } from '../types.js';

export class OpenRouterProvider implements LLMProvider {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || null;
  }

  public async chat(config: AIConfig, systemPrompt: string, history: ChatMessageHistory[], prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured.');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text
      })),
      { role: 'user', content: prompt }
    ];

    const body = {
      model: config.model || 'meta-llama/llama-3-8b-instruct:free',
      messages,
      temperature: config.temperature ?? 0.7,
      top_p: config.topP ?? 0.9,
      max_tokens: config.maxTokens ?? 1500
    };

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aiquest.com', // Site metadata
          'X-Title': 'AI Quest Platform'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenRouter request failed with status ${res.status}: ${errText}`);
      }

      const json = await res.json() as any;
      return json.choices?.[0]?.message?.content || '';
    } catch (err: any) {
      console.error('[OpenRouterProvider] Request error:', err);
      throw err;
    }
  }

  public async embeddings(texts: string[]): Promise<number[][]> {
    // Generate 128 dimension local vectors as OpenRouter does not guarantee embeddings API availability
    return texts.map(() => new Array(128).fill(0).map(() => Math.random()));
  }

  public async vision(config: AIConfig, imageBase64: string, prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured.');
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const body = {
      model: config.model || 'google/gemini-flash-1.5-experimental',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${cleanBase64}` }
            }
          ]
        }
      ]
    };

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenRouter Vision failed: ${errText}`);
      }

      const json = await res.json() as any;
      return json.choices?.[0]?.message?.content || '';
    } catch (err: any) {
      console.error('[OpenRouterProvider] Vision error:', err);
      throw err;
    }
  }

  public async countTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 4);
  }

  public async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }
}
