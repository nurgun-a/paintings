export type TaskType = 'riddle' | 'photo' | 'geolocation' | 'qrcode' | 'audio' | 'video';

export interface QuestTask {
  id: number;
  type: TaskType;
  title: string;
  description: string;
  answers?: string[];
  hint?: string;
  successMessage?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  radius?: number; // in meters
  media?: {
    image?: string;
    audio?: string;
    video?: string;
  };
}

export interface PlayerProfile {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  email?: string;
  registered: boolean;
}

export interface QuestProgress {
  currentTaskId: number;
  completedTaskIds: number[];
  answers: Record<number, string>; // answers or logs
  photos: Record<number, string>; // base64 string
  audios: Record<number, string>; // base64 string
  videos: Record<number, string>; // base64 string
  startedAt?: string;
  finishedAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'player' | 'ai';
  text: string;
  timestamp: string;
}
