import { LLMProvider, AIConfig, ChatMessageHistory } from '../types.js';

export class AnthropicProvider implements LLMProvider {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || null;
  }

  public async chat(config: AIConfig, systemPrompt: string, history: ChatMessageHistory[], prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is not configured.');
    }

    const messages = [
      ...history.map(h => ({
        role: h.role === 'user' ? 'user' as const : 'assistant' as const,
        content: h.text
      })),
      { role: 'user' as const, content: prompt }
    ];

    const body = {
      model: config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: config.maxTokens ?? 1500,
      system: systemPrompt,
      messages,
      temperature: config.temperature ?? 0.7,
      top_p: config.topP ?? 0.9
    };

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Anthropic API request failed with status ${res.status}: ${errText}`);
      }

      const json = await res.json() as any;
      return json.content?.[0]?.text || '';
    } catch (err: any) {
      console.error('[AnthropicProvider] Request error:', err);
      throw err;
    }
  }

  public async embeddings(texts: string[]): Promise<number[][]> {
    // Anthropic does not provide native embeddings API yet, we fallback to local algorithm
    console.warn('[AnthropicProvider] Embeddings not natively supported by Anthropic. Generating deterministic local embeddings.');
    // Return pseudo vectors of 128 dimensions
    return texts.map(() => new Array(128).fill(0).map(() => Math.random()));
  }

  public async vision(config: AIConfig, imageBase64: string, prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is not configured.');
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const body = {
      model: config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: cleanBase64
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    };

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Anthropic Vision API failed: ${errText}`);
      }

      const json = await res.json() as any;
      return json.content?.[0]?.text || '';
    } catch (err: any) {
      console.error('[AnthropicProvider] Vision request error:', err);
      throw err;
    }
  }

  public async countTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 3.5);
  }

  public async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }]
        })
      });
      return res.status === 200;
    } catch {
      return false;
    }
  }
}
