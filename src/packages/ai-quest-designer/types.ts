import { QuestProject, QuestStep, NPC } from '../types/index.js';

export interface DesignerQuestion {
  id: string;
  field: string;
  questionText: string;
  placeholder: string;
  options?: string[];
}

export interface DesignerSession {
  id: string;
  idea: string;
  answers: Record<string, string>;
  currentStep: 'prompt' | 'questions' | 'generating' | 'review' | 'simulation' | 'completed';
  questions: DesignerQuestion[];
  generatedDraft: QuestProject | null;
  agentLogs: { agent: string; status: 'idle' | 'working' | 'done' | 'error'; message: string }[];
}

export type AgentType = 'story' | 'designer' | 'puzzle' | 'balance' | 'qa';

export interface AgentResponse {
  agentName: string;
  role: string;
  contribution: string;
  outputJson?: any;
}

export interface SimulationLog {
  timestamp: string;
  sender: 'player' | 'gamemaster' | 'system' | 'evaluator';
  text: string;
  stepIndex: number;
  success?: boolean;
}

export interface SimulationResult {
  persona: 'Beginner' | 'Normal' | 'Expert';
  success: boolean;
  stepsCompleted: number;
  totalSteps: number;
  logs: SimulationLog[];
  issuesFound: string[];
  durationMinutes: number;
}

export interface AIReviewReport {
  strengths: string[];
  vulnerabilities: string[];
  risks: string[];
  recommendations: string[];
  overallScore: number; // 0 to 100
}
