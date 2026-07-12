export interface NPC {
  id: string;
  name: string;
  role: string;
  personality: string;
  avatar: string; // Tailwind icon class or emoji
}

export type StepType = 'TEXT' | 'QR' | 'PHOTO' | 'LOCATION' | 'TIMER' | 'CUSTOM';

export interface QuestStep {
  id: string;
  title: string;
  description: string;
  type: StepType;
  verificationData: {
    answers?: string[]; // For TEXT: lowercase, trimmed expected phrases
    qrCode?: string; // For QR: the string expected to scan
    referenceImage?: string; // For PHOTO: server-side comparison base64
    coords?: { lat: number; lng: number; radius: number }; // For LOCATION: lat, lng, and accuracy radius (meters)
    duration?: number; // For TIMER: countdown seconds
  };
  reward: {
    xp: number;
    item?: string;
    achievement?: string;
  };
}

export interface QuestProject {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published';
  lore: {
    systemPrompt: string;
    story: string;
    rules: string;
  };
  npcs: NPC[];
  steps: QuestStep[];
}

export interface ChatMessage {
  sender: 'player' | 'gamemaster' | 'system';
  text: string;
  timestamp: string;
  imageUrl?: string; // Optional user image if verification uploaded
}

export interface QuestProgress {
  currentStepIndex: number;
  completed: boolean;
  chatHistory: ChatMessage[];
}

export interface PlayerProfile {
  userId: string;
  username: string;
  level: number;
  xp: number;
  rank: string;
  inventory: string[];
  achievements: string[];
  questProgress: Record<string, QuestProgress>; // key is questProjectId
}

export interface LiveEvent {
  id: string;
  title: string;
  description: string;
  type: StepType;
  verificationData: {
    answers?: string[];
    qrCode?: string;
    coords?: { lat: number; lng: number; radius: number };
    duration?: number;
  };
  reward: {
    xp: number;
    item?: string;
  };
  timestamp: string;
}
