import { PlayerQuestStats } from '../types.js';

export class StatsEngine {
  private static instance: StatsEngine;
  private statsStore: Map<string, PlayerQuestStats> = new Map(); // key: userId:questId

  private constructor() {}

  public static getInstance(): StatsEngine {
    if (!StatsEngine.instance) {
      StatsEngine.instance = new StatsEngine();
    }
    return StatsEngine.instance;
  }

  private getStoreKey(userId: string, questId: string): string {
    return `${userId}:${questId}`;
  }

  /**
   * Initializes real-time telemetry monitoring for a user on a quest.
   */
  public startTracking(userId: string, questId: string): PlayerQuestStats {
    const key = this.getStoreKey(userId, questId);
    
    const initialStats: PlayerQuestStats = {
      userId,
      questId,
      startTime: new Date().toISOString(),
      completedStepsCount: 0,
      failedAttempts: 0,
      totalDurationSeconds: 0,
      popularItemsAcquired: []
    };

    this.statsStore.set(key, initialStats);
    return initialStats;
  }

  /**
   * Increments the count of puzzles successfully solved.
   */
  public incrementCompletedSteps(userId: string, questId: string): void {
    const key = this.getStoreKey(userId, questId);
    const stats = this.statsStore.get(key) || this.startTracking(userId, questId);
    stats.completedStepsCount += 1;
    this.updateDuration(stats);
  }

  /**
   * Logs a failed puzzle input attempt.
   */
  public recordFailedAttempt(userId: string, questId: string, errorType?: string): void {
    const key = this.getStoreKey(userId, questId);
    const stats = this.statsStore.get(key) || this.startTracking(userId, questId);
    stats.failedAttempts += 1;
    if (errorType) {
      stats.lastErrorType = errorType;
    }
    this.updateDuration(stats);
  }

  /**
   * Registers mystical items obtained.
   */
  public recordItemAcquired(userId: string, questId: string, itemId: string): void {
    const key = this.getStoreKey(userId, questId);
    const stats = this.statsStore.get(key) || this.startTracking(userId, questId);
    if (!stats.popularItemsAcquired.includes(itemId)) {
      stats.popularItemsAcquired.push(itemId);
    }
    this.updateDuration(stats);
  }

  /**
   * Concludes monitoring and logs final completion parameters.
   */
  public stopTracking(userId: string, questId: string): PlayerQuestStats | null {
    const key = this.getStoreKey(userId, questId);
    const stats = this.statsStore.get(key);
    if (!stats) return null;

    stats.endTime = new Date().toISOString();
    this.updateDuration(stats);
    return stats;
  }

  /**
   * Fetches the current stats telemetry.
   */
  public getStats(userId: string, questId: string): PlayerQuestStats | null {
    const key = this.getStoreKey(userId, questId);
    const stats = this.statsStore.get(key);
    if (stats) {
      this.updateDuration(stats);
    }
    return stats || null;
  }

  /**
   * Compiles global aggregate metrics across all active users.
   */
  public getGlobalQuestMetrics(questId: string): {
    totalPlayers: number;
    averageCompletionTimeSeconds: number;
    averageFailureCount: number;
    popularQuestItems: Record<string, number>;
  } {
    const list = Array.from(this.statsStore.values()).filter(s => s.questId === questId);
    if (list.length === 0) {
      return { totalPlayers: 0, averageCompletionTimeSeconds: 0, averageFailureCount: 0, popularQuestItems: {} };
    }

    let completedTimesCount = 0;
    let sumCompletionTimes = 0;
    let sumFailures = 0;
    const itemsCount: Record<string, number> = {};

    list.forEach(s => {
      this.updateDuration(s);
      if (s.endTime) {
        sumCompletionTimes += s.totalDurationSeconds;
        completedTimesCount += 1;
      }
      sumFailures += s.failedAttempts;
      s.popularItemsAcquired.forEach(item => {
        itemsCount[item] = (itemsCount[item] || 0) + 1;
      });
    });

    return {
      totalPlayers: list.length,
      averageCompletionTimeSeconds: completedTimesCount > 0 ? Math.round(sumCompletionTimes / completedTimesCount) : 0,
      averageFailureCount: Math.round(sumFailures / list.length),
      popularQuestItems: itemsCount
    };
  }

  private updateDuration(stats: PlayerQuestStats): void {
    const start = new Date(stats.startTime).getTime();
    const end = stats.endTime ? new Date(stats.endTime).getTime() : Date.now();
    stats.totalDurationSeconds = Math.max(0, Math.floor((end - start) / 1000));
  }
}

export const statsEngine = StatsEngine.getInstance();
