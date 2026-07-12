import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { 
  RealtimeMessage, 
  RealtimeEventType, 
  RealtimeMetrics 
} from '../types.js';
import { presenceService } from '../presence/presence.service.js';
import { roomManager } from '../rooms/room.manager.js';
import { heartbeatService } from '../heartbeat/heartbeat.service.js';
import { synchronizationService } from '../sync/sync.service.js';
import { retryQueue } from '../queue/retry.queue.js';
import { realtimeSecurityManager } from '../security/security.manager.js';
import { notificationService } from '../notifications/notification.service.js';

export class RealtimeGateway {
  private io!: Server;
  private metrics: RealtimeMetrics = {
    activeConnections: 0,
    totalEventsProcessed: 0,
    averageLatencyMs: 0,
    reconnectionsCount: 0,
    failedDeliveries: 0,
    queueDepth: 0
  };

  private static instance: RealtimeGateway;

  private constructor() {}

  public static getInstance(): RealtimeGateway {
    if (!RealtimeGateway.instance) {
      RealtimeGateway.instance = new RealtimeGateway();
    }
    return RealtimeGateway.instance;
  }

  /**
   * Binds the Socket.IO server on top of the Express Server.
   */
  public attach(server: HttpServer): void {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 30000,
      pingInterval: 10000
    });

    // Register retry queue broadcaster callback
    retryQueue.registerRetrySender(async (recipientId, msg) => {
      return this.sendToUserDirectly(recipientId, msg);
    });

    // Connection Handler
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    console.log('[Realtime Gateway] Socket.IO engine successfully attached to HTTP server.');
  }

  /**
   * Gateway-wide performance monitoring metrics retrieval.
   */
  public getMetrics(): RealtimeMetrics {
    this.metrics.activeConnections = this.io ? this.io.engine.clientsCount : 0;
    this.metrics.queueDepth = retryQueue.getQueueDepth();
    return this.metrics;
  }

  /**
   * Broadcast message to a room (e.g. project, team).
   */
  public broadcastToRoom(roomId: string, eventType: RealtimeEventType, payload: any): void {
    const message: RealtimeMessage = {
      id: `evt-${Math.random().toString(36).substring(2, 11)}`,
      sequence: synchronizationService.getNextSequence(),
      type: eventType,
      payload,
      timestamp: new Date().toISOString(),
      version: '1.0',
      roomId
    };

    // Store in historical sync buffer
    synchronizationService.recordMessage(roomId, message);

    if (this.io) {
      this.io.to(roomId).emit('event', message);
      this.metrics.totalEventsProcessed++;
    }
  }

  /**
   * Sends a message directly to a user's active sockets, with retry delivery guarantees.
   */
  public sendToUserDirectly(userId: string, message: RealtimeMessage): boolean {
    if (!this.io) return false;

    // Record in history for the direct private message channel
    synchronizationService.recordMessage(userId, message);

    // Find active sockets for this user ID
    let delivered = false;
    const sockets = Array.from(this.io.sockets.sockets.values());
    for (const socket of sockets) {
      if (socket.data?.userId === userId) {
        socket.emit('event', message);
        delivered = true;
      }
    }

    if (delivered) {
      this.metrics.totalEventsProcessed++;
    } else {
      this.metrics.failedDeliveries++;
    }

    return delivered;
  }

  /**
   * Emits and registers a new notification.
   */
  public triggerNotification(
    userId: string,
    type: 'NEW_TASK' | 'AI_MESSAGE' | 'LEVEL_UP' | 'ACHIEVEMENT' | 'LIVE_EVENT' | 'SYSTEM',
    title: string,
    body: string
  ): void {
    const notify = notificationService.createNotification(userId, type, title, body);
    
    const message: RealtimeMessage = {
      id: `evt-${Math.random().toString(36).substring(2, 11)}`,
      sequence: synchronizationService.getNextSequence(),
      type: 'Notification',
      payload: notify,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Queue in delivery loop for reliable delivery
    retryQueue.enqueueMessage(userId, message);
    this.sendToUserDirectly(userId, message);
  }

  private handleConnection(socket: Socket): void {
    const ip = socket.handshake.address || 'unknown';
    
    // 1. Rate Limiting Check
    if (realtimeSecurityManager.isRateLimited(ip)) {
      socket.emit('error', { message: 'Rate limit exceeded.' });
      socket.disconnect(true);
      return;
    }

    // 2. Authentication Check via JWT Token
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    const user = realtimeSecurityManager.authenticateToken(token);

    if (!user) {
      socket.emit('error', { message: 'Unauthorized connection request.' });
      socket.disconnect(true);
      return;
    }

    // Assign metadata details on connection context
    socket.data = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      connectedAt: Date.now()
    };

    // 3. Register heartbeat monitoring & Presence
    heartbeatService.registerConnection(socket.id, user.userId);

    // 4. Join default player rooms
    roomManager.joinRoom(user.userId, `player:${user.userId}`);
    roomManager.joinRoom(user.userId, `role:${user.role}`);
    socket.join(`player:${user.userId}`);
    socket.join(`role:${user.role}`);

    // If query includes a project context, auto-join project room
    const projectId = socket.handshake.query?.projectId;
    if (typeof projectId === 'string') {
      roomManager.joinRoom(user.userId, `project:${projectId}`);
      socket.join(`project:${projectId}`);
    }

    // 5. Automatic synchronization catch-up of missed messages
    const lastEventId = socket.handshake.query?.lastEventId;
    const lastSequenceStr = socket.handshake.query?.lastSequence;
    const lastSequence = lastSequenceStr ? parseInt(lastSequenceStr as string, 10) : undefined;

    const missedRooms = roomManager.getUserRooms(user.userId);
    let missedMessages: RealtimeMessage[] = [];

    // Catch up private events
    missedMessages = missedMessages.concat(
      synchronizationService.catchUp(user.userId, lastEventId as string, lastSequence)
    );

    // Catch up room events
    for (const room of missedRooms) {
      missedMessages = missedMessages.concat(
        synchronizationService.catchUp(room, lastEventId as string, lastSequence)
      );
    }

    // Deduplicate and deliver in strict sequential sequence FIFO order
    missedMessages = missedMessages.filter((msg, idx, self) => self.findIndex(m => m.id === msg.id) === idx);
    missedMessages.sort((a, b) => a.sequence - b.sequence);

    if (missedMessages.length > 0) {
      console.log(`[Realtime Gateway] Reconnection catch-up: delivering ${missedMessages.length} missed events to user "${user.userId}"`);
      this.metrics.reconnectionsCount++;
      socket.emit('sync_catchup', { messages: missedMessages });
    }

    // 6. Register Socket Event Handlers
    this.registerEventHandlers(socket);
  }

  private registerEventHandlers(socket: Socket): void {
    const userId = socket.data.userId;

    // ACK confirmation from client
    socket.on('ack', (data: { messageId: string }) => {
      if (data && data.messageId) {
        retryQueue.handleAck(data.messageId);
      }
    });

    // Heartbeat Keep-Alive ping
    socket.on('heartbeat', (data: { latencyMs?: number }) => {
      heartbeatService.receiveHeartbeat(socket.id, data?.latencyMs);
      socket.emit('heartbeat_ack', { timestamp: new Date().toISOString() });
    });

    // Dynamic presence updates (e.g. going idle or changing quest steps)
    socket.on('presence_update', (data: { status: 'online' | 'offline' | 'idle'; questId?: string; stepId?: string }) => {
      if (data) {
        if (data.status === 'idle') {
          presenceService.setIdle(userId);
        } else if (data.status === 'online') {
          presenceService.updatePresence(userId, 'online', 'excellent', data.questId, data.stepId);
        }
        // Broadcast presence update to organizer room
        this.io.to('role:ADMIN').emit('presence_changed', presenceService.getPresence(userId));
      }
    });

    // Chat Message handler
    socket.on('chat_message', (data: { text: string; roomId: string }) => {
      if (data && data.text && data.roomId) {
        const message: RealtimeMessage = {
          id: `evt-${Math.random().toString(36).substring(2, 11)}`,
          sequence: synchronizationService.getNextSequence(),
          type: 'ChatMessage',
          payload: {
            text: data.text,
            senderId: userId,
            senderEmail: socket.data.email
          },
          timestamp: new Date().toISOString(),
          version: '1.0',
          roomId: data.roomId
        };

        synchronizationService.recordMessage(data.roomId, message);
        this.io.to(data.roomId).emit('event', message);
      }
    });

    // Typing Indicator
    socket.on('typing', (data: { typing: boolean; roomId: string }) => {
      if (data && data.roomId) {
        socket.to(data.roomId).emit('typing_status', {
          userId,
          email: socket.data.email,
          typing: data.typing
        });
      }
    });

    // Clean disconnection teardown
    socket.on('disconnect', () => {
      heartbeatService.removeConnection(socket.id);
      roomManager.leaveAllRooms(userId);
      console.log(`[Realtime Gateway] Socket disconnected explicitly: ${socket.id}`);
    });
  }
}

export const realtimeGateway = RealtimeGateway.getInstance();
