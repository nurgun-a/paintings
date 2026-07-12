import { VisionProvider, VisionAnalysisResult, OCRResult } from '../types.js';

export class LocalVisionProvider implements VisionProvider {
  public readonly name = 'local';

  public async analyze(base64Image: string, targetDescription: string = 'anything'): Promise<VisionAnalysisResult> {
    return {
      similarity: 0.95,
      confidence: 0.90,
      detectedObjects: [targetDescription.split(' ')[0] || 'relic', 'nature', 'taiga_item'],
      reasoning: 'Симуляция: Детектор духов тайги подтверждает подлинность артефакта.',
      boundingBoxes: []
    };
  }

  public async ocr(base64Image: string, languages: string[] = ['ru', 'en']): Promise<OCRResult> {
    return {
      success: true,
      text: 'БАЙАНАЙ 2026',
      detectedLanguages: ['ru'],
      confidence: 0.98
    };
  }

  public async detectObjects(base64Image: string): Promise<{ objects: string[]; confidence: number }> {
    return {
      objects: ['relic', 'ancient_altar', 'nature'],
      confidence: 0.92
    };
  }
}
