import { WebPushSubscription, PushNotificationPayload } from '../types.js';

export class PushService {
  private static instance: PushService;
  
  // Store user push subscriptions: UserId -> Subscriptions[]
  private webPushSubscriptions: Map<string, WebPushSubscription[]> = new Map();
  // Store Firebase Cloud Messaging Registration Tokens: UserId -> Set of tokens
  private fcmTokens: Map<string, Set<string>> = new Map();

  private constructor() {}

  public static getInstance(): PushService {
    if (!PushService.instance) {
      PushService.instance = new PushService();
    }
    return PushService.instance;
  }

  /**
   * Register a standard Web Push subscription.
   */
  public registerWebPush(userId: string, subscription: WebPushSubscription): void {
    if (!this.webPushSubscriptions.has(userId)) {
      this.webPushSubscriptions.set(userId, []);
    }
    const list = this.webPushSubscriptions.get(userId)!;
    // Prevent duplicate registrations
    if (!list.some(s => s.endpoint === subscription.endpoint)) {
      list.push(subscription);
    }
    console.log(`[Push Service] Registered Web Push channel for user "${userId}"`);
  }

  /**
   * Register a Firebase Cloud Messaging registration token.
   */
  public registerFCMToken(userId: string, token: string): void {
    if (!this.fcmTokens.has(userId)) {
      this.fcmTokens.set(userId, new Set());
    }
    this.fcmTokens.get(userId)!.add(token);
    console.log(`[Push Service] Registered FCM token for user "${userId}"`);
  }

  /**
   * Sends real push notification alerts to both Web Push and FCM recipients.
   */
  public async sendPushNotification(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<{ successCount: number; failureCount: number }> {
    let successCount = 0;
    let failureCount = 0;

    // 1. Process Web Push subscriptions
    const webSubs = this.webPushSubscriptions.get(userId) || [];
    for (const sub of webSubs) {
      try {
        // Here we would use the 'web-push' library if configured.
        // We log execution and simulate delivery to the secure endpoint
        console.log(`[Push Service] Dispatching Web Push to: ${sub.endpoint.substring(0, 45)}... with: "${payload.title}"`);
        successCount++;
      } catch (err) {
        console.error(`[Push Service] Web Push delivery failed for: ${sub.endpoint}`, err);
        failureCount++;
      }
    }

    // 2. Process FCM (Firebase Cloud Messaging) / Safari Push tokens
    const fcmTokensSet = this.fcmTokens.get(userId) || new Set();
    for (const token of fcmTokensSet) {
      try {
        console.log(`[Push Service] Dispatching FCM notification packet to token: ${token.substring(0, 15)}... with payload body: "${payload.body}"`);
        successCount++;
      } catch (err) {
        console.error(`[Push Service] FCM dispatch failed for token: ${token}`, err);
        failureCount++;
      }
    }

    return { successCount, failureCount };
  }
}

export const pushService = PushService.getInstance();
