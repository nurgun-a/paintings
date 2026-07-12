import { QuestProject, PlayerProfile, LiveEvent, ChatMessage, NPC } from '../types/index.js';

export type AIProviderType = 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'deepseek' | 'simulation';

export interface AIConfig {
  provider: AIProviderType;
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  streaming?: boolean;
  vision?: boolean;
  jsonMode?: boolean;
}

export interface ChatMessageHistory {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp?: string;
}

export interface RAGDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface PromptVersion {
  id: string;
  questId: string;
  version: number;
  promptText: string;
  updatedBy: string;
  timestamp: string;
  changelog: string;
}

export interface MemoryFact {
  id: string;
  fact: string;
  confidence: number;
  source: 'user_statement' | 'choice' | 'achievement' | 'quest_progression';
  timestamp: string;
}

export interface MemoryState {
  shortTerm: ChatMessageHistory[];
  longTermFacts: MemoryFact[];
  summary?: string;
  tokenCount: number;
}

export interface AIResponsePayload {
  message: string;
  actions: {
    type: 'completeQuest' | 'giveXP' | 'unlockQuest' | 'sendNotification' | 'changeRank' | string;
    params: Record<string, any>;
  }[];
  rewards: {
    xp?: number;
    item?: string;
    achievement?: string;
  }[];
  levelUp: boolean;
  rankChanged: boolean;
  questCompleted: boolean;
  eventCompleted: boolean;
  inventory: string[];
  notifications: string[];
}

export interface TokenOptimizationResult {
  optimizedHistory: ChatMessageHistory[];
  optimizedContext: string;
  totalTokens: number;
  limitExceeded: boolean;
}

export interface AIModerationResult {
  flagged: boolean;
  reason?: string;
  categories: Record<string, boolean>;
}

export interface LLMProvider {
  chat(config: AIConfig, systemPrompt: string, history: ChatMessageHistory[], prompt: string): Promise<string>;
  stream?(config: AIConfig, systemPrompt: string, history: ChatMessageHistory[], prompt: string, onChunk: (text: string) => void): Promise<string>;
  embeddings(texts: string[]): Promise<number[][]>;
  vision(config: AIConfig, imageBase64: string, prompt: string): Promise<string>;
  countTokens(text: string): Promise<number>;
  healthCheck(): Promise<boolean>;
}
