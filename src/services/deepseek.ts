import { ChatMessage, QuestTask } from '../types';

export interface ChatPayload {
  message: string;
  history: ChatMessage[];
  currentTask?: QuestTask;
  playerName?: string;
}

/**
 * Service to interact with the DeepSeek/Gemini server-side AI proxy.
 */
export const deepseekService = {
  /**
   * Sends a message to the AI Guardian with full quest context.
   */
  async sendMessage(payload: ChatPayload): Promise<{ text: string; provider: string }> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: payload.message,
          history: payload.history,
          currentTask: payload.currentTask,
          playerName: payload.playerName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to communicate with AI Guardian service:', error);
      throw error;
    }
  },
};
