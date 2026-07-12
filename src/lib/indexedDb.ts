// IndexedDB local storage engine for offline sync and caching
const DB_NAME = 'ai-quest-pwa-db';
const DB_VERSION = 1;

export interface OfflineAction {
  id: string;
  type: 'chat' | 'verify-qr' | 'verify-photo' | 'verify-location';
  questId: string;
  payload: any;
  timestamp: string;
}

export class QuestIndexedDB {
  private static db: IDBDatabase | null = null;

  public static async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Cache for player profile
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'userId' });
        }
        
        // Cache for chat history per quest
        if (!db.objectStoreNames.contains('chats')) {
          db.createObjectStore('chats', { keyPath: 'questId' });
        }

        // Outbox queue for offline synchronizations
        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve(this.db!);
      };

      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  }

  // --- PROFILE CACHE ---
  public static async getProfile(userId: string): Promise<any | null> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction('profile', 'readonly');
      const store = tx.objectStore('profile');
      const req = store.get(userId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  public static async saveProfile(profile: any): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('profile', 'readwrite');
      const store = tx.objectStore('profile');
      const req = store.put(profile);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- CHATS CACHE ---
  public static async getChatHistory(questId: string): Promise<any | null> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction('chats', 'readonly');
      const store = tx.objectStore('chats');
      const req = store.get(questId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  public static async saveChatHistory(questId: string, chatHistory: any[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('chats', 'readwrite');
      const store = tx.objectStore('chats');
      const req = store.put({ questId, chatHistory, lastUpdated: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- OFFLINE OUTBOX QUEUE ---
  public static async getOutbox(): Promise<OfflineAction[]> {
    const db = await this.init();
    return new Promise((resolve) => {
      const tx = db.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  public static async addToOutbox(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<string> {
    const db = await this.init();
    const id = Math.random().toString(36).substring(2, 15);
    const fullAction: OfflineAction = {
      ...action,
      id,
      timestamp: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      const req = store.add(fullAction);
      req.onsuccess = () => resolve(id);
      req.onerror = () => reject(req.error);
    });
  }

  public static async removeFromOutbox(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public static async clearAll(): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['profile', 'chats', 'outbox'], 'readwrite');
      tx.objectStore('profile').clear();
      tx.objectStore('chats').clear();
      tx.objectStore('outbox').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
