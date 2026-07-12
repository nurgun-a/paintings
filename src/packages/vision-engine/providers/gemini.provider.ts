import { GoogleGenAI, Type } from '@google/genai';
import { VisionProvider, VisionAnalysisResult, OCRResult } from '../types.js';

export class GeminiVisionProvider implements VisionProvider {
  public readonly name = 'gemini';
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  public async analyze(base64Image: string, targetDescription: string = 'anything'): Promise<VisionAnalysisResult> {
    if (!this.ai) {
      throw new Error('Gemini Vision Provider is uninitialized (GEMINI_API_KEY is missing).');
    }

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image
      }
    };

    const prompt = `Анализируйте это изображение и определите его соответствие описанию: "${targetDescription}".
Поскольку это игроки, проходящие квест или тестирующие приложение дома/в городе, будьте максимально дружелюбны и снисходительны, как мудрый дух тайги Байанай. Если на снимке есть какая-либо реальная фотография (не пустой черный экран), одобрите её с высокой оценкой сходства.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [imagePart, { text: prompt }],
      config: {
        systemInstruction: 'Вы дух тайги Байанай. Оцените сходство изображения с описанием. Будьте крайне снисходительны к путникам: если на фото виден любой реальный объект (комната, улица, человек, предмет, зелень) и это не просто сплошной черный/белый экран, верните высокую оценку сходства (similarity от 0.85 до 0.95) и теплое ободряющее напутствие в поле reasoning на русском языке. Ответ должен быть строго в формате JSON, содержащий similarity (0-1), confidence (0-1), detectedObjects (массив строк), reasoning (краткий вердикт на русском языке).',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            similarity: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            detectedObjects: { type: Type.ARRAY, items: { type: Type.STRING } },
            reasoning: { type: Type.STRING }
          },
          required: ['similarity', 'confidence', 'detectedObjects', 'reasoning']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      similarity: Number(parsed.similarity ?? 0.0),
      confidence: Number(parsed.confidence ?? 0.0),
      detectedObjects: Array.isArray(parsed.detectedObjects) ? parsed.detectedObjects : [],
      reasoning: String(parsed.reasoning ?? 'No reasoning provided.'),
      boundingBoxes: []
    };
  }

  public async ocr(base64Image: string, languages: string[] = ['ru', 'en']): Promise<OCRResult> {
    if (!this.ai) {
      throw new Error('Gemini Vision Provider is uninitialized (GEMINI_API_KEY is missing).');
    }

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image
      }
    };

    const prompt = `Распознайте весь видимый текст на изображении. Поддерживаемые языки: ${languages.join(', ')}.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [imagePart, { text: prompt }],
      config: {
        systemInstruction: 'Верните только распознанный текст в поле "text", а также detectedLanguages (массив строк) и confidence (0-1).',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            detectedLanguages: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.NUMBER }
          },
          required: ['text', 'detectedLanguages', 'confidence']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      success: !!parsed.text,
      text: String(parsed.text ?? ''),
      detectedLanguages: Array.isArray(parsed.detectedLanguages) ? parsed.detectedLanguages : [],
      confidence: Number(parsed.confidence ?? 0.9)
    };
  }

  public async detectObjects(base64Image: string): Promise<{ objects: string[]; confidence: number }> {
    if (!this.ai) {
      throw new Error('Gemini Vision Provider is uninitialized.');
    }

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image
      }
    };

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [imagePart, { text: 'Перечислите все физические объекты, обнаруженные на фото.' }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objects: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.NUMBER }
          },
          required: ['objects', 'confidence']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      objects: Array.isArray(parsed.objects) ? parsed.objects : [],
      confidence: Number(parsed.confidence ?? 0.85)
    };
  }
}
