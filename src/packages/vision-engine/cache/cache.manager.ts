export class VisionCacheManager {
  private static instance: VisionCacheManager;
  private memoryStore: Map<string, { data: any; expiry: number }> = new Map();

  private constructor() {
    // Periodically sweep expired cache items
    setInterval(() => this.sweepExpired(), 60000).unref();
  }

  public static getInstance(): VisionCacheManager {
    if (!VisionCacheManager.instance) {
      VisionCacheManager.instance = new VisionCacheManager();
    }
    return VisionCacheManager.instance;
  }

  /**
   * Retrieves a cached value.
   */
  public async get<T = any>(key: string): Promise<T | null> {
    const item = this.memoryStore.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.memoryStore.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Caches a value with a configurable Time To Live (TTL) in seconds.
   */
  public async set<T = any>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.memoryStore.set(key, { data: value, expiry });
  }

  /**
   * Invalidates a cache item.
   */
  public async delete(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  /**
   * Clears the entire cache.
   */
  public async clear(): Promise<void> {
    this.memoryStore.clear();
  }

  private sweepExpired(): void {
    const now = Date.now();
    for (const [key, val] of this.memoryStore.entries()) {
      if (now > val.expiry) {
        this.memoryStore.delete(key);
      }
    }
  }
}

export const visionCache = VisionCacheManager.getInstance();
