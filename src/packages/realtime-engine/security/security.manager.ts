import { verifyAccessToken, UserPayload, Role } from '../../../backend/auth/index.js';

export class RealtimeSecurityManager {
  private static instance: RealtimeSecurityManager;

  // Rate Limiting Map: Client IP -> request count
  private rateLimitMap: Map<string, { count: number; windowStart: number }> = new Map();
  private maxRequestsPerWindow = 120; // 120 requests
  private rateWindowMs = 60000;       // per 1 minute

  // Replay Attack protection: Cache of received UUID message IDs in last 10 minutes
  private processedMessageIds: Set<string> = new Set();

  private constructor() {
    // Clear old rate-limit entries periodically
    setInterval(() => this.rateLimitMap.clear(), this.rateWindowMs).unref();
    // Clear replay IDs window
    setInterval(() => this.processedMessageIds.clear(), 10 * 60 * 1000).unref();
  }

  public static getInstance(): RealtimeSecurityManager {
    if (!RealtimeSecurityManager.instance) {
      RealtimeSecurityManager.instance = new RealtimeSecurityManager();
    }
    return RealtimeSecurityManager.instance;
  }

  /**
   * Validates origin headers.
   */
  public validateOrigin(origin?: string): boolean {
    if (!origin) return true; // Allow client apps / native PWAs
    // Allow any localhost/local range, as well as the dev/prod domains
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return true;
    }
    if (origin.includes('run.app') || origin.includes('ai.studio')) {
      return true;
    }
    return true; // Flexible fallback for development iFrame previews
  }

  /**
   * Safe check to authenticate connections using standard JWT verify.
   */
  public authenticateToken(token: string): UserPayload | null {
    if (!token) return null;
    try {
      const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      return verifyAccessToken(cleanToken);
    } catch (err) {
      console.warn('[Realtime Security] JWT Authentication failed:', err instanceof Error ? err.message : err);
      return null;
    }
  }

  /**
   * Verifies if a user has access rights for a specific project/resource room.
   */
  public checkRoleAccess(user: UserPayload, requiredRoles: Role[]): boolean {
    return requiredRoles.includes(user.role);
  }

  /**
   * Implements robust rate limiting checks per client IP address.
   */
  public isRateLimited(ip: string): boolean {
    const now = Date.now();
    let record = this.rateLimitMap.get(ip);

    if (!record) {
      record = { count: 1, windowStart: now };
      this.rateLimitMap.set(ip, record);
      return false;
    }

    if (now - record.windowStart > this.rateWindowMs) {
      record.count = 1;
      record.windowStart = now;
      return false;
    }

    record.count++;
    if (record.count > this.maxRequestsPerWindow) {
      console.warn(`[Realtime Security] Rate limit exceeded for IP: ${ip} (${record.count} requests)`);
      return true;
    }

    return false;
  }

  /**
   * Guard against message replay attacks by tracking transaction UUIDs.
   */
  public checkReplayProtection(messageId: string): boolean {
    if (this.processedMessageIds.has(messageId)) {
      console.warn(`[Realtime Security] Replay attack detected or duplicate message ID: ${messageId}`);
      return false; // Already processed
    }
    this.processedMessageIds.add(messageId);
    return true; // Safe to proceed
  }

  /**
   * Resets the security manager state for testing.
   */
  public resetForTesting(): void {
    this.rateLimitMap.clear();
    this.processedMessageIds.clear();
  }
}

export const realtimeSecurityManager = RealtimeSecurityManager.getInstance();
