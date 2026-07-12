import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  databaseUrl: string;
  geminiApiKey: string;
  appUrl: string;
  storageProvider: 'local' | 's3' | 'r2';
  s3Bucket: string;
  s3Region: string;
  s3AccessKey: string;
  s3SecretKey: string;
}

export const config: AppConfig = {
  env: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'super_secret_ai_quest_auth_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_quest_db',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  storageProvider: (process.env.STORAGE_PROVIDER as 'local' | 's3' | 'r2') || 'local',
  s3Bucket: process.env.S3_BUCKET || 'ai-quest-assets',
  s3Region: process.env.S3_REGION || 'us-east-1',
  s3AccessKey: process.env.S3_ACCESS_KEY || '',
  s3SecretKey: process.env.S3_SECRET_KEY || '',
};

// Validate critical configurations
export function validateConfig() {
  const missingSecrets: string[] = [];
  if (!config.geminiApiKey) {
    missingSecrets.push('GEMINI_API_KEY');
  }
  
  if (missingSecrets.length > 0) {
    console.warn(
      `[CONFIG WARNING]: The following configurations are not set: ${missingSecrets.join(', ')}. ` +
      `System will gracefully degrade and fallback to simulated AI responses.`
    );
  }
}

validateConfig();
