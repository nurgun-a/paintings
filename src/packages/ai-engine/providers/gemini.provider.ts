import { GoogleGenAI } from '@google/genai';
import { LLMProvider, AIConfig, ChatMessageHistory } from '../types.js';

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
  }

  public async chat(config: AIConfig, systemPrompt: string, history: ChatMessageHistory[], prompt: string): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured.');
    }

    const contents: any[] = [];
    let lastRole: string | null = null;

    for (const h of history) {
      const currentRole = h.role === 'user' ? 'user' : 'model';
      if (currentRole === lastRole) {
        if (contents.length > 0) {
          contents[contents.length - 1].parts[0].text += `\n${h.text}`;
        } else {
          contents.push({ role: currentRole, parts: [{ text: h.text }] });
        }
      } else {
        contents.push({ role: currentRole, parts: [{ text: h.text }] });
      }
      lastRole = currentRole;
    }

    if (lastRole === 'user') {
      if (contents.length > 0) {
        contents[contents.length - 1].parts[0].text += `\n${prompt}`;
      } else {
        contents.push({ role: 'user', parts: [{ text: prompt }] });
      }
    } else {
      contents.push({ role: 'user', parts: [{ text: prompt }] });
    }

    const generateConfig: any = {
      temperature: config.temperature ?? 0.7,
      topP: config.topP ?? 0.9,
      systemInstruction: systemPrompt,
    };

    if (config.jsonMode) {
      generateConfig.responseMimeType = 'application/json';
    }

    const response = await this.client.models.generateContent({
      model: config.model || 'gemini-3.5-flash',
      contents,
      config: generateConfig
    });

    return response.text || '';
  }

  public async embeddings(texts: string[]): Promise<number[][]> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured.');
    }
    const results: number[][] = [];
    for (const text of texts) {
      const res = await this.client.models.embedContent({
        model: 'text-embedding-004',
        contents: text
      });
      const resAny = res as any;
      const values = resAny.embedding?.values || resAny.embeddings?.values;
      if (values) {
        results.push(values);
      } else {
        throw new Error('Failed to retrieve embedding values');
      }
    }
    return results;
  }

  public async vision(config: AIConfig, imageBase64: string, prompt: string): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured.');
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const response = await this.client.models.generateContent({
      model: config.model || 'gemini-3.5-flash',
      contents: [
        { inlineData: { mimeType, data: cleanBase64 } },
        { text: prompt }
      ]
    });

    return response.text || '';
  }

  public async countTokens(text: string): Promise<number> {
    // Basic word/char estimation or call Gemini countTokens API
    if (!this.client) return Math.ceil(text.length / 3);
    try {
      const res = await this.client.models.countTokens({
        model: 'gemini-3.5-flash',
        contents: text
      });
      return res.totalTokens || Math.ceil(text.length / 3);
    } catch {
      return Math.ceil(text.length / 3);
    }
  }

  public async healthCheck(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: 'ping'
      });
      return true;
    } catch {
      return false;
    }
  }
}
