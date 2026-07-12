export type RealtimeEventType =
  | 'ChatMessage'
  | 'Typing'
  | 'QuestUpdated'
  | 'QuestCompleted'
  | 'QuestUnlocked'
  | 'StepUnlocked'
  | 'LevelUp'
  | 'RankChanged'
  | 'AchievementUnlocked'
  | 'InventoryChanged'
  | 'Notification'
  | 'LiveEvent'
  | 'AdminBroadcast'
  | 'PhotoChecked'
  | 'QRChecked'
  | 'LocationChecked'
  | 'AIMessage'
  | 'Reconnect'
  | 'Disconnect';

export type UserPresenceStatus = 'online' | 'offline' | 'idle';

export interface PresenceState {
  userId: string;
  status: UserPresenceStatus;
  lastSeen: string; // ISO string
  connectionQuality: 'excellent' | 'good' | 'poor';
  currentQuestId?: string;
  currentStepId?: string;
}

export interface RealtimeMessage<T = any> {
  id: string;         // UUID
  sequence: number;   // Monotonic incremental sequence number
  type: RealtimeEventType;
  payload: T;
  timestamp: string;  // ISO string
  version: string;    // Versioning for backward compatibility (e.g. "1.0")
  senderId?: string;
  roomId?: string;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

export interface RealtimeNotification {
  id: string;
  userId: string;
  type: 'NEW_TASK' | 'AI_MESSAGE' | 'LEVEL_UP' | 'ACHIEVEMENT' | 'LIVE_EVENT' | 'SYSTEM';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface RealtimeMetrics {
  activeConnections: number;
  totalEventsProcessed: number;
  averageLatencyMs: number;
  reconnectionsCount: number;
  failedDeliveries: number;
  queueDepth: number;
}
