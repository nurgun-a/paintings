export type EventCallback<T = any> = (payload: T) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribes a listener callback to a specific game event.
   */
  public subscribe<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return an unsubscribe function
    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Unsubscribes all listeners for a given event.
   */
  public clearListeners(event: string): void {
    this.listeners.delete(event);
  }

  /**
   * Publishes an event, notifying all subscribers asynchronously.
   */
  public async publish<T = any>(event: string, payload: T): Promise<void> {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;

    // Run callbacks in parallel without blocking execution of each other
    const promises = Array.from(set).map(async (callback) => {
      try {
        await callback(payload);
      } catch (err) {
        console.error(`[EventBus] Error in callback for event "${event}":`, err);
      }
    });

    await Promise.all(promises);
  }
}

export const eventBus = EventBus.getInstance();
