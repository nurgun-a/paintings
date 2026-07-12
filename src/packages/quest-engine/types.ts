import { PlayerProfile, QuestProject, QuestStep, LiveEvent } from '../types/index.js';

export type GameStateId = 'START' | 'INTRO' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ENDING' | string;

export type EventType = 
  | 'TEXT' 
  | 'PHOTO' 
  | 'QR' 
  | 'LOCATION' 
  | 'VIDEO' 
  | 'AUDIO' 
  | 'CUSTOM' 
  | 'LIVE' 
  | 'TIMER';

export interface QuestEngineConfig {
  xpPerLevel: number;
  baseXpMultiplier: number;
}

// System-wide logical conditions
export interface QuestCondition {
  id: string;
  type: 
    | 'LEVEL_GTE' 
    | 'RANK_EQUALS' 
    | 'HAS_ACHIEVEMENT' 
    | 'HAS_ITEM' 
    | 'QUEST_COMPLETED' 
    | 'FLAG_EQUALS' 
    | 'VARIABLE_COMPRESSED' 
    | 'LOCATION_RADIUS' 
    | 'QR_VALID' 
    | 'TEXT_MATCH';
  params: Record<string, any>;
}

// Reactive actions executed post-evaluation
export interface QuestAction {
  id: string;
  type: 
    | 'GIVE_XP' 
    | 'UNLOCK_QUEST' 
    | 'GIVE_ITEM' 
    | 'REMOVE_ITEM' 
    | 'CHANGE_RANK' 
    | 'SEND_NOTIFICATION' 
    | 'TRIGGER_LIVE_EVENT' 
    | 'SET_FLAG' 
    | 'SET_VARIABLE';
  params: Record<string, any>;
}

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'item' | 'key' | 'artifact' | 'document' | 'code' | 'virtual';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: ItemRarity;
  type: ItemType;
  weight: number;
  quantity: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rarity: 'common' | 'legendary' | 'secret';
  xpReward: number;
  unlockedAt?: string;
}

// Complete rich state for the engine representing a Player's total progression
export interface QuestPlayerState {
  userId: string;
  currentQuestId: string;
  currentState: GameStateId;
  currentStepIndex: number;
  unlockedQuests: string[];
  completedQuests: string[];
  failedQuests: string[];
  inventory: InventoryItem[];
  xp: number;
  level: number;
  rank: string;
  achievements: Achievement[];
  variables: Record<string, any>;
  flags: Record<string, boolean>;
  updatedAt: string;
}

// Historical check points representing snapshots of state for rollbacks
export interface SaveCheckpoint {
  id: string;
  userId: string;
  timestamp: string;
  stateSnapshot: QuestPlayerState;
  reason: string;
}

// Statistics metrics captured on gameplay milestones
export interface PlayerQuestStats {
  userId: string;
  questId: string;
  startTime: string;
  endTime?: string;
  completedStepsCount: number;
  failedAttempts: number;
  totalDurationSeconds: number;
  popularItemsAcquired: string[];
  lastErrorType?: string;
}

// State transition rules mapping nodes
export interface StateTransition {
  fromState: GameStateId;
  toState: GameStateId;
  conditions: QuestCondition[];
  actionsOnTransition: QuestAction[];
}

export interface GameStateMachine {
  id: string;
  name: string;
  initialState: GameStateId;
  states: Record<GameStateId, {
    name: string;
    description: string;
    transitions: StateTransition[];
  }>;
}

// Engine Plug-in Interface for custom types
export interface QuestEventPlugin {
  eventType: EventType;
  validate(eventPayload: any, requirementParams: Record<string, any>): Promise<{ success: boolean; confidence?: number; similarity?: number }>;
}
