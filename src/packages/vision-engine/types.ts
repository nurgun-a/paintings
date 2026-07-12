export type VisionProviderType = 'gemini' | 'openai' | 'opencv' | 'local';

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  mimeType: string;
  hasExif: boolean;
  exif?: Record<string, any>;
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  label?: string;
}

export interface VisionAnalysisResult {
  similarity: number;   // 0.0 to 1.0
  confidence: number;   // 0.0 to 1.0
  detectedObjects: string[];
  reasoning: string;
  boundingBoxes?: BoundingBox[];
}

export interface OCRResult {
  success: boolean;
  text: string;
  detectedLanguages: string[];
  confidence: number;
}

export interface QRResult {
  success: boolean;
  code: string;
  format: 'QR' | 'DataMatrix' | 'EAN' | 'Code128' | string;
}

export interface ClassificationResult {
  className: 'photo' | 'document' | 'selfie' | 'landscape' | string;
  confidence: number;
}

export interface VisionPipelineResult {
  success: boolean;
  similarity: number;
  confidence: number;
  objects: string[];
  text: string;
  qr: string;
  metadata: ImageMetadata | Record<string, any>;
  classification?: ClassificationResult;
  errors: string[];
  latencyMs: number;
  provider: VisionProviderType;
}

export interface VisionEngineConfig {
  defaultProvider: VisionProviderType;
  defaultThreshold: number; // default e.g. 0.8
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
}

// Interfaces for plugins / strategies
export interface VisionProvider {
  name: VisionProviderType;
  analyze(base64Image: string, targetDescription?: string): Promise<VisionAnalysisResult>;
  ocr(base64Image: string, languages?: string[]): Promise<OCRResult>;
  detectObjects(base64Image: string): Promise<{ objects: string[]; confidence: number }>;
}
