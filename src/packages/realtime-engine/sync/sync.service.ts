import { RealtimeMessage } from '../types.js';

export class SynchronizationService {
  private static instance: SynchronizationService;

  // Global sequential counter to maintain precise event ordering
  private sequenceCounter = 0;

  // History buffer: RoomID/UserID -> RealtimeMessage[]
  private messageHistory: Map<string, RealtimeMessage[]> = new Map();
  private maxHistorySize = 1000; // retain last 1000 messages per channel

  private constructor() {}

  public static getInstance(): SynchronizationService {
    if (!SynchronizationService.instance) {
      SynchronizationService.instance = new SynchronizationService();
    }
    return SynchronizationService.instance;
  }

  /**
   * Generates the next global sequential event sequence number.
   */
  public getNextSequence(): number {
    this.sequenceCounter++;
    return this.sequenceCounter;
  }

  /**
   * Appends an event to the history buffer of a room or user.
   */
  public recordMessage(channelId: string, message: RealtimeMessage): void {
    if (!this.messageHistory.has(channelId)) {
      this.messageHistory.set(channelId, []);
    }
    const history = this.messageHistory.get(channelId)!;
    history.push(message);

    // Keep buffer bounded
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Retrieves all missed events since a specific message ID or sequence number.
   * Ensures strict FIFO order preservation.
   */
  public catchUp(channelId: string, lastEventId?: string, lastSequence?: number): RealtimeMessage[] {
    const history = this.messageHistory.get(channelId) || [];
    
    if (!lastEventId && !lastSequence) {
      return history;
    }

    if (lastSequence !== undefined) {
      return history.filter(msg => msg.sequence > lastSequence);
    }

    const index = history.findIndex(msg => msg.id === lastEventId);
    if (index === -1) {
      // If lastEventId is not found (perhaps cleared), return the whole buffered timeline
      return history;
    }

    return history.slice(index + 1);
  }

  /**
   * Clear message history.
   */
  public clearHistory(channelId: string): void {
    this.messageHistory.delete(channelId);
  }

  /**
   * Resets the synchronization service state for testing.
   */
  public resetForTesting(): void {
    this.sequenceCounter = 0;
    this.messageHistory.clear();
  }
}

export const synchronizationService = SynchronizationService.getInstance();
