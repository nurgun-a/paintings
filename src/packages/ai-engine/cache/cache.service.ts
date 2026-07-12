import Redis from 'ioredis';

export class CacheService {
  private static instance: CacheService;
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: string; expiresAt: number }> = new Map();
  private isRedisConnected = false;

  private constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          retryStrategy: (times) => {
            if (times > 3) {
              console.warn('[CacheService] Redis connection failed, switching permanently to local memory fallback.');
              return null; // Stop retrying
            }
            return Math.min(times * 100, 1000);
          }
        });

        this.redis.on('connect', () => {
          this.isRedisConnected = true;
          console.log('[CacheService] Redis connected successfully.');
        });

        this.redis.on('error', (err) => {
          this.isRedisConnected = false;
          console.warn('[CacheService] Redis connection error, using in-memory cache:', err.message);
        });
      } catch (err) {
        console.warn('[CacheService] Failed to initialize Redis client. Falling back to in-memory caching.', err);
      }
    } else {
      console.log('[CacheService] REDIS_URL not set. Running in local in-memory cache mode.');
    }
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public async get(key: string): Promise<string | null> {
    if (this.isRedisConnected && this.redis) {
      try {
        return await this.redis.get(key);
      } catch (err) {
        console.warn('[CacheService] Redis GET failed, using in-memory backup:', err);
      }
    }

    const cached = this.memoryCache.get(key);
    if (cached) {
      if (Date.now() < cached.expiresAt) {
        return cached.value;
      }
      this.memoryCache.delete(key);
    }
    return null;
  }

  public async set(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.set(key, value, 'EX', ttlSeconds);
        return;
      } catch (err) {
        console.warn('[CacheService] Redis SET failed, using in-memory backup:', err);
      }
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  public async delete(key: string): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch (err) {
        console.warn('[CacheService] Redis DEL failed, deleting from in-memory:', err);
      }
    }
    this.memoryCache.delete(key);
  }

  public async clear(): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.flushall();
        return;
      } catch (err) {
        console.warn('[CacheService] Redis FLUSHALL failed:', err);
      }
    }
    this.memoryCache.clear();
  }
}
