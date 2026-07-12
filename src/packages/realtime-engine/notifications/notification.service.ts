import { RealtimeNotification } from '../types.js';

export class NotificationService {
  private static instance: NotificationService;
  private notifications: Map<string, RealtimeNotification[]> = new Map();

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Generates and stores a new notification for a targeted user.
   */
  public createNotification(
    userId: string,
    type: 'NEW_TASK' | 'AI_MESSAGE' | 'LEVEL_UP' | 'ACHIEVEMENT' | 'LIVE_EVENT' | 'SYSTEM',
    title: string,
    body: string
  ): RealtimeNotification {
    const notification: RealtimeNotification = {
      id: `notify-${Math.random().toString(36).substring(2, 11)}`,
      userId,
      type,
      title,
      body,
      createdAt: new Date().toISOString(),
      read: false
    };

    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId)!.push(notification);

    console.log(`[Notification Service] Dispatched "${type}" to user "${userId}": "${title}"`);
    return notification;
  }

  /**
   * Gets all notifications for a specific user.
   */
  public getUserNotifications(userId: string): RealtimeNotification[] {
    return this.notifications.get(userId) || [];
  }

  /**
   * Marks a specific notification as read.
   */
  public markAsRead(userId: string, notificationId: string): boolean {
    const list = this.notifications.get(userId);
    if (!list) return false;

    const notify = list.find(n => n.id === notificationId);
    if (notify) {
      notify.read = true;
      return true;
    }
    return false;
  }

  /**
   * Clear user's notifications.
   */
  public clearAll(userId: string): void {
    this.notifications.delete(userId);
  }
}

export const notificationService = NotificationService.getInstance();
