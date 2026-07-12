import { QuestAction, QuestPlayerState } from '../types.js';
import { RewardEngine } from '../rewards/reward.engine.js';
import { InventoryEngine } from '../inventory/inventory.engine.js';
import { eventBus } from '../core/event-bus.js';

export class ActionEngine {
  /**
   * Safely executes an action payload onto a player state.
   */
  public static async execute(action: QuestAction, state: QuestPlayerState): Promise<{ success: boolean; logs: string[] }> {
    const { type, params } = action;
    const logs: string[] = [];

    switch (type) {
      case 'GIVE_XP': {
        const amount = Number(params.amount ?? 0);
        const mult = Number(params.multiplier ?? 1.0);
        const res = await RewardEngine.awardXP(state, amount, mult);
        logs.push(`✨ Получено +${res.xpGained} XP!`);
        return { success: true, logs };
      }

      case 'UNLOCK_QUEST': {
        const questId = String(params.questId ?? '');
        if (questId && !state.unlockedQuests.includes(questId)) {
          state.unlockedQuests.push(questId);
          logs.push(`🔑 Разблокирован новый квест: ${questId}`);
          await eventBus.publish('QUEST_UNLOCKED', { userId: state.userId, questId });
        }
        return { success: true, logs };
      }

      case 'GIVE_ITEM': {
        const itemPayload = params.item;
        if (!itemPayload || !itemPayload.id) {
          return { success: false, logs: ['Ошибка выдачи предмета: неверные параметры.'] };
        }
        const qty = Number(params.quantity ?? 1);
        const res = InventoryEngine.addItem(state, itemPayload, qty, params.maxWeight);
        if (res.success) {
          logs.push(`🎒 В рюкзак добавлен предмет: ${itemPayload.name} (${qty} шт.)`);
          await eventBus.publish('ITEM_ACQUIRED', { userId: state.userId, itemId: itemPayload.id, qty });
          return { success: true, logs };
        } else {
          return { success: false, logs: [res.reason || 'Ошибка добавления в инвентарь'] };
        }
      }

      case 'REMOVE_ITEM': {
        const itemId = String(params.itemId ?? '');
        const qty = Number(params.quantity ?? 1);
        const res = InventoryEngine.removeItem(state, itemId, qty);
        if (res.success) {
          logs.push(`🎒 Из рюкзака извлечен предмет: ${itemId}`);
          await eventBus.publish('ITEM_REMOVED', { userId: state.userId, itemId, qty });
          return { success: true, logs };
        } else {
          return { success: false, logs: [res.reason || 'Ошибка извлечения предмета'] };
        }
      }

      case 'CHANGE_RANK': {
        const oldRank = state.rank;
        const newRank = String(params.newRank ?? '');
        if (newRank && oldRank !== newRank) {
          state.rank = newRank;
          logs.push(`🏆 Получено новое звание: "${newRank}"!`);
          await eventBus.publish('PLAYER_RANK_CHANGED', { userId: state.userId, oldRank, newRank });
        }
        return { success: true, logs };
      }

      case 'SEND_NOTIFICATION': {
        const text = String(params.text ?? '');
        if (text) {
          logs.push(`🔔 Оповещение: ${text}`);
          await eventBus.publish('NOTIFICATION_SENT', { userId: state.userId, text });
        }
        return { success: true, logs };
      }

      case 'TRIGGER_LIVE_EVENT': {
        const eventId = String(params.eventId ?? '');
        const title = String(params.title ?? 'Экстренное событие');
        if (eventId) {
          logs.push(`🚨 Активировано глобальное событие: "${title}"!`);
          await eventBus.publish('LIVE_EVENT_TRIGGERED', { userId: state.userId, eventId, title });
        }
        return { success: true, logs };
      }

      case 'SET_FLAG': {
        const flagName = String(params.flagName ?? '');
        const val = !!params.value;
        if (flagName) {
          state.flags[flagName] = val;
          logs.push(`⚙️ Флаг игры [${flagName}] изменен на ${val}`);
        }
        return { success: true, logs };
      }

      case 'SET_VARIABLE': {
        const varName = String(params.varName ?? '');
        const val = params.value;
        if (varName) {
          state.variables[varName] = val;
          logs.push(`⚙️ Переменная игры [${varName}] обновлена.`);
        }
        return { success: true, logs };
      }

      default:
        return { success: false, logs: [`Неизвестный тип действия: ${type}`] };
    }
  }

  /**
   * Executes a batch of actions sequentially.
   */
  public static async executeBatch(actions: QuestAction[], state: QuestPlayerState): Promise<{ success: boolean; logs: string[] }> {
    const combinedLogs: string[] = [];
    for (const act of actions) {
      const res = await this.execute(act, state);
      combinedLogs.push(...res.logs);
      if (!res.success) {
        return { success: false, logs: combinedLogs };
      }
    }
    return { success: true, logs: combinedLogs };
  }
}
