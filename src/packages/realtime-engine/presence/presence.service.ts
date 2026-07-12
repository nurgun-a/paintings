import { PresenceState, UserPresenceStatus } from '../types.js';

export class PresenceService {
  private static instance: PresenceService;
  private presenceMap: Map<string, PresenceState> = new Map();

  private constructor() {}

  public static getInstance(): PresenceService {
    if (!PresenceService.instance) {
      PresenceService.instance = new PresenceService();
    }
    return PresenceService.instance;
  }

  /**
   * Set user presence.
   */
  public updatePresence(
    userId: string,
    status: UserPresenceStatus,
    connectionQuality: 'excellent' | 'good' | 'poor' = 'excellent',
    questId?: string,
    stepId?: string
  ): PresenceState {
    const existing = this.presenceMap.get(userId);
    const updated: PresenceState = {
      userId,
      status,
      lastSeen: new Date().toISOString(),
      connectionQuality,
      currentQuestId: questId || existing?.currentQuestId,
      currentStepId: stepId || existing?.currentStepId,
    };
    this.presenceMap.set(userId, updated);
    return updated;
  }

  /**
   * Get presence for a single user.
   */
  public getPresence(userId: string): PresenceState | null {
    return this.presenceMap.get(userId) || null;
  }

  /**
   * Get all active (online or idle) presences for monitoring.
   */
  public getAllActivePresences(): PresenceState[] {
    return Array.from(this.presenceMap.values()).filter(p => p.status !== 'offline');
  }

  /**
   * Set a user to offline status.
   */
  public setOffline(userId: string): void {
    const existing = this.presenceMap.get(userId);
    if (existing) {
      existing.status = 'offline';
      existing.lastSeen = new Date().toISOString();
    } else {
      this.presenceMap.set(userId, {
        userId,
        status: 'offline',
        lastSeen: new Date().toISOString(),
        connectionQuality: 'poor',
      });
    }
  }

  /**
   * Set a user to idle status (due to inactivity).
   */
  public setIdle(userId: string): void {
    const existing = this.presenceMap.get(userId);
    if (existing) {
      existing.status = 'idle';
      existing.lastSeen = new Date().toISOString();
    }
  }
}

export const presenceService = PresenceService.getInstance();
