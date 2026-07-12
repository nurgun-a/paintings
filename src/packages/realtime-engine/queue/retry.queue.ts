import { RealtimeMessage } from '../types.js';

interface PendingDelivery {
  message: RealtimeMessage;
  recipientId: string;
  retryCount: number;
  lastAttempt: number;
  nextAttempt: number;
}

export class RetryQueue {
  private static instance: RetryQueue;

  // Map of MessageId -> PendingDelivery
  private pendingDeliveries: Map<string, PendingDelivery> = new Map();
  private maxRetries = 5;
  private baseBackoffMs = 1000; // start with 1 second

  private onRetryCallback?: (recipientId: string, message: RealtimeMessage) => Promise<boolean>;

  private constructor() {
    // Start retry monitor loop
    setInterval(() => this.processRetries(), 1000).unref();
  }

  public static getInstance(): RetryQueue {
    if (!RetryQueue.instance) {
      RetryQueue.instance = new RetryQueue();
    }
    return RetryQueue.instance;
  }

  /**
   * Registers a callback to execute actual delivery on retry.
   */
  public registerRetrySender(callback: (recipientId: string, message: RealtimeMessage) => Promise<boolean>): void {
    this.onRetryCallback = callback;
  }

  /**
   * Enqueues a message for guaranteed delivery.
   */
  public enqueueMessage(recipientId: string, message: RealtimeMessage): void {
    const delivery: PendingDelivery = {
      message,
      recipientId,
      retryCount: 0,
      lastAttempt: Date.now(),
      nextAttempt: Date.now() + this.baseBackoffMs,
    };
    this.pendingDeliveries.set(message.id, delivery);
    console.log(`[Retry Queue] Registered tracking for message "${message.id}" (Type: ${message.type}) to "${recipientId}"`);
  }

  /**
   * Confirms delivery of a message (ACK). Removes it from the retry queue.
   */
  public handleAck(messageId: string): boolean {
    const deleted = this.pendingDeliveries.delete(messageId);
    if (deleted) {
      console.log(`[Retry Queue] Received ACK confirmation for message "${messageId}". Cleared from retry list.`);
    }
    return deleted;
  }

  /**
   * Get depth of queue.
   */
  public getQueueDepth(): number {
    return this.pendingDeliveries.size;
  }

  /**
   * Scans and processes pending retries based on backoff intervals.
   */
  private async processRetries(): Promise<void> {
    const now = Date.now();
    for (const [id, delivery] of this.pendingDeliveries.entries()) {
      if (now >= delivery.nextAttempt) {
        if (delivery.retryCount >= this.maxRetries) {
          console.warn(`[Retry Queue] Message "${id}" exceeded maximum retry attempts (${this.maxRetries}). Discarding.`);
          this.pendingDeliveries.delete(id);
          continue;
        }

        delivery.retryCount++;
        delivery.lastAttempt = now;
        
        // Exponential backoff
        const backoff = this.baseBackoffMs * Math.pow(2, delivery.retryCount);
        delivery.nextAttempt = now + backoff;

        console.log(`[Retry Queue] Retrying message "${id}" to "${delivery.recipientId}" (Attempt ${delivery.retryCount}/${this.maxRetries})`);

        if (this.onRetryCallback) {
          try {
            const success = await this.onRetryCallback(delivery.recipientId, delivery.message);
            if (success) {
              // If immediately acked, or successfully pushed, we can optionally clear
              // depending on transport layer context.
            }
          } catch (err) {
            console.error(`[Retry Queue] Retry delivery callback errored for "${id}":`, err);
          }
        }
      }
    }
  }
}

export const retryQueue = RetryQueue.getInstance();
