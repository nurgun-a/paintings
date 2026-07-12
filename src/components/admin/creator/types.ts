import { QuestProject, QuestStep, NPC } from '../../../packages/types/index';

export interface CMSProject extends QuestProject {
  coverImage?: string;
  icon?: string;
  language?: 'ru' | 'en' | 'de' | 'cn';
  category?: string;
  ageLimit?: string;
  playersCount?: string;
  durationMinutes?: number;
  authorName?: string;
  versionString?: string;
  translations?: Record<string, Record<string, string>>;
  items?: CMSItem[];
  achievements?: CMSAchievement[];
  levels?: CMSLevel[];
  systemPromptVersions?: SystemPromptVersion[];
  changeLogs?: ChangeLogEntry[];
}

export interface CMSItem {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji
  type: 'key' | 'quest' | 'weapon' | 'consumable' | 'artifact';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface CMSAchievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji
  xpReward: number;
  conditions: string;
}

export interface CMSLevel {
  level: number;
  xpRequired: number;
  title: string;
  icon: string; // Emoji
}

export interface SystemPromptVersion {
  id: string;
  version: string;
  content: string;
  timestamp: string;
  author: string;
}

export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  author: string;
  action: string;
}

export interface CMSAnalytics {
  stepFails: Record<string, number>;
  stepLeavers: Record<string, number>;
  averageCompletionTime: string;
  activePlayersCount: number;
  totalCompletions: number;
}
