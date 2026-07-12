import { Achievement, QuestPlayerState } from '../types.js';
import { eventBus } from '../core/event-bus.js';

export class RewardEngine {
  private static XP_PER_LEVEL = 500;

  /**
   * Safely adds XP to a player's profile, calculating automatic level-ups and rank promotions.
   */
  public static async awardXP(
    state: QuestPlayerState,
    baseAmount: number,
    multiplier: number = 1.0,
    bonusFlat: number = 0
  ): Promise<{ levelUp: boolean; oldLevel: number; newLevel: number; xpGained: number }> {
    const xpGained = Math.round(baseAmount * multiplier) + bonusFlat;
    if (xpGained <= 0) {
      return { levelUp: false, oldLevel: state.level, newLevel: state.level, xpGained: 0 };
    }

    const oldLevel = state.level;
    const oldRank = state.rank;

    state.xp += xpGained;
    
    // Automatic Level calculation: Level = Math.floor(xp / 500) + 1
    const newLevel = Math.floor(state.xp / this.XP_PER_LEVEL) + 1;
    const levelUp = newLevel > oldLevel;

    if (levelUp) {
      state.level = newLevel;
    }

    // Refresh rank based on level tier
    const rankChanged = this.updatePlayerRank(state, oldRank);

    state.updatedAt = new Date().toISOString();

    // Trigger reactive events
    await eventBus.publish('PLAYER_XP_GAINED', { userId: state.userId, xpGained, currentXp: state.xp });
    
    if (levelUp) {
      await eventBus.publish('PLAYER_LEVEL_UP', {
        userId: state.userId,
        oldLevel,
        newLevel,
        rank: state.rank
      });
    }

    if (rankChanged) {
      await eventBus.publish('PLAYER_RANK_CHANGED', {
        userId: state.userId,
        oldRank,
        newRank: state.rank
      });
    }

    return {
      levelUp,
      oldLevel,
      newLevel,
      xpGained
    };
  }

  /**
   * Evaluates and unlocks an achievement for a player.
   */
  public static async awardAchievement(
    state: QuestPlayerState,
    achievement: Omit<Achievement, 'unlockedAt'>
  ): Promise<boolean> {
    const alreadyUnlocked = state.achievements.some(a => a.id === achievement.id);
    if (alreadyUnlocked) return false;

    const unlocked: Achievement = {
      ...achievement,
      unlockedAt: new Date().toISOString()
    };

    state.achievements.push(unlocked);

    // Achievements automatically award XP
    if (unlocked.xpReward > 0) {
      await this.awardXP(state, unlocked.xpReward);
    }

    state.updatedAt = new Date().toISOString();

    await eventBus.publish('PLAYER_ACHIEVEMENT_UNLOCKED', {
      userId: state.userId,
      achievement: unlocked
    });

    return true;
  }

  /**
   * Evaluates level tier to automatically update player rank string.
   * Returns true if rank changed.
   */
  private static updatePlayerRank(state: QuestPlayerState, oldRank: string): boolean {
    let automaticRank = 'Новичок';

    if (state.level >= 10) {
      automaticRank = 'Великий Шаман';
    } else if (state.level >= 6) {
      automaticRank = 'Архивариус';
    } else if (state.level >= 3) {
      automaticRank = 'Следопыт';
    }

    // If an administrative rank custom bypass is set, we preserve it unless levels exceed it.
    if (state.rank && state.rank !== 'Новичок' && state.rank !== 'Следопыт' && state.rank !== 'Архивариус' && state.rank !== 'Великий Шаман') {
      // Custom title exists, do not overwrite unless level tiers are higher
      return false;
    }

    if (automaticRank !== oldRank) {
      state.rank = automaticRank;
      return true;
    }

    return false;
  }
}
