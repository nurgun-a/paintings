import { presenceService } from '../presence/presence.service.js';

export class HeartbeatService {
  private static instance: HeartbeatService;

  // Track last heartbeat timestamp per connection: ConnectionId (socketId) -> timestamp
  private lastHeartbeatMap: Map<string, number> = new Map();
  // Map ConnectionId -> UserId
  private connectionUserMap: Map<string, string> = new Map();

  private checkIntervalMs = 15000; // check every 15 seconds
  private timeoutThresholdMs = 45000; // 45 seconds timeout

  private constructor() {
    setInterval(() => this.sweepDeadConnections(), this.checkIntervalMs).unref();
  }

  public static getInstance(): HeartbeatService {
    if (!HeartbeatService.instance) {
      HeartbeatService.instance = new HeartbeatService();
    }
    return HeartbeatService.instance;
  }

  /**
   * Registers a client socket connection and maps it to a user ID.
   */
  public registerConnection(connectionId: string, userId: string): void {
    const now = Date.now();
    this.lastHeartbeatMap.set(connectionId, now);
    this.connectionUserMap.set(connectionId, userId);
    presenceService.updatePresence(userId, 'online', 'excellent');
    console.log(`[Heartbeat Service] Registered connection "${connectionId}" for user "${userId}"`);
  }

  /**
   * Records a heartbeat event from a client connection, updating connection quality.
   */
  public receiveHeartbeat(connectionId: string, latencyMs?: number): void {
    this.lastHeartbeatMap.set(connectionId, Date.now());
    
    const userId = this.connectionUserMap.get(connectionId);
    if (userId) {
      // Assess quality based on roundtrip ping latency
      let quality: 'excellent' | 'good' | 'poor' = 'excellent';
      if (latencyMs !== undefined) {
        if (latencyMs > 300) quality = 'poor';
        else if (latencyMs > 100) quality = 'good';
      }
      presenceService.updatePresence(userId, 'online', quality);
    }
  }

  /**
   * Removes a connection explicitly (e.g. on clean socket disconnect).
   */
  public removeConnection(connectionId: string): void {
    const userId = this.connectionUserMap.get(connectionId);
    this.lastHeartbeatMap.delete(connectionId);
    this.connectionUserMap.delete(connectionId);

    if (userId) {
      // Check if user has other connections before marking offline
      const userStillConnected = Array.from(this.connectionUserMap.values()).includes(userId);
      if (!userStillConnected) {
        presenceService.setOffline(userId);
        console.log(`[Heartbeat Service] User "${userId}" marked offline (no more active connections)`);
      }
    }
  }

  /**
   * Automatically scans for connections that have missed their heartbeat windows.
   */
  private sweepDeadConnections(): void {
    const now = Date.now();
    for (const [connId, lastSeen] of this.lastHeartbeatMap.entries()) {
      if (now - lastSeen > this.timeoutThresholdMs) {
        console.warn(`[Heartbeat Service] Connection "${connId}" timed out. Exceeded threshold of ${this.timeoutThresholdMs}ms.`);
        this.removeConnection(connId);
      }
    }
  }
}

export const heartbeatService = HeartbeatService.getInstance();
