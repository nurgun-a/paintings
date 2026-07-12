import { OpenAI } from 'openai';
import { LLMProvider, AIConfig, ChatMessageHistory } from '../types.js';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  public async chat(config: AIConfig, systemPrompt: string, history: ChatMessageHistory[], prompt: string): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI API key is not configured.');
    }

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text
      })),
      { role: 'user', content: prompt }
    ];

    const params: any = {
      model: config.model || 'gpt-4o-mini',
      messages,
      temperature: config.temperature ?? 0.7,
      top_p: config.topP ?? 0.9,
      max_tokens: config.maxTokens ?? 1500,
      presence_penalty: config.presencePenalty ?? 0,
      frequency_penalty: config.frequencyPenalty ?? 0,
    };

    if (config.jsonMode) {
      params.response_format = { type: 'json_object' };
    }

    const completion = await this.client.chat.completions.create(params);
    return completion.choices[0]?.message?.content || '';
  }

  public async embeddings(texts: string[]): Promise<number[][]> {
    if (!this.client) {
      throw new Error('OpenAI API key is not configured.');
    }

    const res = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts
    });

    return res.data.map(d => d.embedding);
  }

  public async vision(config: AIConfig, imageBase64: string, prompt: string): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI API key is not configured.');
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const completion = await this.client.chat.completions.create({
      model: config.model || 'gpt-4o-mini',
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
      ],
      max_tokens: 1000
    });

    return completion.choices[0]?.message?.content || '';
  }

  public async countTokens(text: string): Promise<number> {
    // Estimator
    return Math.ceil(text.length / 4);
  }

  public async healthCheck(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5
      });
      return true;
    } catch {
      return false;
    }
  }
}
