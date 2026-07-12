import { QuestPlayerState, SaveCheckpoint } from '../types.js';
import { eventBus } from '../core/event-bus.js';

export class SaveEngine {
  private static instance: SaveEngine;
  // Deep storage representing database persistence backup snapshots
  private checkpointsStore: Map<string, SaveCheckpoint[]> = new Map();

  private constructor() {}

  public static getInstance(): SaveEngine {
    if (!SaveEngine.instance) {
      SaveEngine.instance = new SaveEngine();
    }
    return SaveEngine.instance;
  }

  /**
   * Captures a deep copy snapshot of current player state and registers it as an audit checkpoint.
   */
  public createCheckpoint(state: QuestPlayerState, reason: string): SaveCheckpoint {
    const userId = state.userId;
    if (!this.checkpointsStore.has(userId)) {
      this.checkpointsStore.set(userId, []);
    }

    // Capture deep snapshot to avoid state mutability references
    const deepSnapshot = JSON.parse(JSON.stringify(state)) as QuestPlayerState;

    const checkpoint: SaveCheckpoint = {
      id: `cp-${Math.random().toString(36).substring(2, 11)}`,
      userId,
      timestamp: new Date().toISOString(),
      stateSnapshot: deepSnapshot,
      reason
    };

    this.checkpointsStore.get(userId)!.push(checkpoint);
    console.log(`[Save Engine] Checkpoint "${checkpoint.id}" captured for user: ${userId}. Reason: "${reason}"`);
    return checkpoint;
  }

  /**
   * Administrative Rollback method to restore player profile state to a specific checkpoint.
   */
  public async rollbackToCheckpoint(userId: string, checkpointId: string): Promise<QuestPlayerState> {
    const userHistory = this.checkpointsStore.get(userId);
    if (!userHistory || userHistory.length === 0) {
      throw new Error(`No historical snapshots found for user: ${userId}`);
    }

    const target = userHistory.find(cp => cp.id === checkpointId);
    if (!target) {
      throw new Error(`Checkpoint snapshot with ID "${checkpointId}" not found.`);
    }

    // Restore deep snapshot copy
    const restoredState = JSON.parse(JSON.stringify(target.stateSnapshot)) as QuestPlayerState;
    restoredState.updatedAt = new Date().toISOString();

    // Append rollback trace checkpoint
    this.createCheckpoint(restoredState, `Административный откат к точке сохранения: [${target.id}]`);

    await eventBus.publish('PLAYER_STATE_ROLLBACK', {
      userId,
      checkpointId,
      restoredState
    });

    return restoredState;
  }

  /**
   * Retrieves chronological checkpoint history of a player.
   */
  public getHistory(userId: string): SaveCheckpoint[] {
    const history = this.checkpointsStore.get(userId) || [];
    return [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Clear snapshots.
   */
  public clear(userId: string): void {
    this.checkpointsStore.delete(userId);
  }
}

export const saveEngine = SaveEngine.getInstance();
