import { EventType, QuestEventPlugin } from '../types.js';

export class PluginAPIManager {
  private static instance: PluginAPIManager;
  private plugins: Map<EventType, QuestEventPlugin> = new Map();

  private constructor() {}

  public static getInstance(): PluginAPIManager {
    if (!PluginAPIManager.instance) {
      PluginAPIManager.instance = new PluginAPIManager();
    }
    return PluginAPIManager.instance;
  }

  /**
   * Registers a new custom validation plugin for a given event type.
   */
  public registerPlugin(plugin: QuestEventPlugin): void {
    this.plugins.set(plugin.eventType, plugin);
    console.log(`[Plugin API] Successfully mounted event plugin for: [${plugin.eventType}]`);
  }

  /**
   * Deregisters an existing plugin.
   */
  public deregisterPlugin(eventType: EventType): void {
    if (this.plugins.delete(eventType)) {
      console.log(`[Plugin API] Demounted event plugin for: [${eventType}]`);
    }
  }

  /**
   * Resolves a validation plugin for an event type if present.
   */
  public getPlugin(eventType: EventType): QuestEventPlugin | undefined {
    return this.plugins.get(eventType);
  }

  /**
   * Checks if a plugin is registered.
   */
  public hasPlugin(eventType: EventType): boolean {
    return this.plugins.has(eventType);
  }
}

export const pluginAPI = PluginAPIManager.getInstance();
