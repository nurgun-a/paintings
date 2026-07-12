import { PlayerProfile, QuestProject } from '../../types/index.js';

export interface ProposedAction {
  type: 'completeQuest' | 'giveXP' | 'unlockQuest' | 'sendNotification' | 'changeRank' | 'addInventoryItem';
  params: Record<string, any>;
}

export interface ToolValidationResult {
  allowed: boolean;
  action: ProposedAction;
  reason?: string;
  stateMutation?: (player: PlayerProfile) => { logs: string[]; levelUp: boolean; rankChanged: boolean };
}

export class ToolEngine {
  /**
   * Defines standard JSON Schema tool declarations to feed into OpenAI/Gemini SDKs.
   */
  public static getToolDeclarations(): any[] {
    return [
      {
        name: 'giveXP',
        description: 'Propose awarding XP points to the player. Max allowed points in single turn is 500.',
        parameters: {
          type: 'OBJECT',
          properties: {
            amount: { type: 'INTEGER', description: 'Amount of XP to grant.' }
          },
          required: ['amount']
        }
      },
      {
        name: 'addInventoryItem',
        description: 'Propose adding a mystical or story item into the player backpack.',
        parameters: {
          type: 'OBJECT',
          properties: {
            item: { type: 'STRING', description: 'Item name, e.g., "Амулет Байаная".' }
          },
          required: ['item']
        }
      },
      {
        name: 'changeRank',
        description: 'Propose changing the player rank title.',
        parameters: {
          type: 'OBJECT',
          properties: {
            newRank: { type: 'STRING', description: 'New rank string, e.g., "Следопыт Тайги".' }
          },
          required: ['newRank']
        }
      },
      {
        name: 'completeQuest',
        description: 'Propose marking the current quest project as successfully completed.',
        parameters: {
          type: 'OBJECT',
          properties: {
            questId: { type: 'STRING', description: 'The unique ID of the quest.' }
          },
          required: ['questId']
        }
      },
      {
        name: 'sendNotification',
        description: 'Propose broadcasting an overlay PWA alert or notification message.',
        parameters: {
          type: 'OBJECT',
          properties: {
            text: { type: 'STRING', description: 'Alert description.' }
          },
          required: ['text']
        }
      }
    ];
  }

  /**
   * Secure firewall and validation sandbox.
   * Analyzes proposed LLM actions, executes security boundaries, and generates state mutator lambdas.
   */
  public static validateAndPrepare(
    proposed: ProposedAction,
    player: PlayerProfile,
    project?: QuestProject
  ): ToolValidationResult {
    const { type, params } = proposed;

    switch (type) {
      case 'giveXP': {
        const amount = Number(params.amount);
        if (isNaN(amount) || amount <= 0) {
          return { allowed: false, action: proposed, reason: 'Invalid XP amount value.' };
        }
        if (amount > 500) {
          return {
            allowed: true,
            action: { type: 'giveXP', params: { amount: 500 } },
            reason: 'XP amount throttled to system safety limit of 500.',
            stateMutation: (p) => this.mutateXP(p, 500)
          };
        }
        return {
          allowed: true,
          action: proposed,
          stateMutation: (p) => this.mutateXP(p, amount)
        };
      }

      case 'addInventoryItem': {
        const item = String(params.item).trim();
        if (!item || item.length > 40) {
          return { allowed: false, action: proposed, reason: 'Item name is blank or too long.' };
        }
        if (player.inventory.includes(item)) {
          return { allowed: false, action: proposed, reason: 'Player already has this item.' };
        }
        return {
          allowed: true,
          action: proposed,
          stateMutation: (p) => {
            p.inventory.push(item);
            return {
              logs: [`🎒 В рюкзак добавлен предмет: ${item}`],
              levelUp: false,
              rankChanged: false
            };
          }
        };
      }

      case 'changeRank': {
        const newRank = String(params.newRank).trim();
        if (!newRank || newRank.length > 30) {
          return { allowed: false, action: proposed, reason: 'Rank is blank or invalid.' };
        }
        return {
          allowed: true,
          action: proposed,
          stateMutation: (p) => {
            const oldRank = p.rank;
            p.rank = newRank;
            return {
              logs: [`🏆 Ваше звание повышено: "${newRank}"`],
              levelUp: false,
              rankChanged: oldRank !== newRank
            };
          }
        };
      }

      case 'completeQuest': {
        const questId = String(params.questId);
        const progress = player.questProgress[questId];
        if (!progress) {
          return { allowed: false, action: proposed, reason: 'Player has not joined this quest.' };
        }
        if (progress.completed) {
          return { allowed: false, action: proposed, reason: 'Quest already completed.' };
        }
        return {
          allowed: true,
          action: proposed,
          stateMutation: (p) => {
            const prog = p.questProgress[questId];
            prog.completed = true;
            return {
              logs: [`🎉 Квест успешно завершен! Поздравляем с победой!`],
              levelUp: false,
              rankChanged: false
            };
          }
        };
      }

      case 'sendNotification': {
        const text = String(params.text).trim();
        if (!text) {
          return { allowed: false, action: proposed, reason: 'Empty notification alert.' };
        }
        return {
          allowed: true,
          action: proposed,
          stateMutation: () => ({
            logs: [`🔔 Оповещение: ${text}`],
            levelUp: false,
            rankChanged: false
          })
        };
      }

      default:
        return { allowed: false, action: proposed, reason: `Unknown proposed action type: ${type}` };
    }
  }

  private static mutateXP(player: PlayerProfile, amount: number): { logs: string[]; levelUp: boolean; rankChanged: boolean } {
    const logs: string[] = [];
    const oldLevel = player.level;
    const oldRank = player.rank;

    player.xp += amount;
    player.level = Math.floor(player.xp / 500) + 1;

    logs.push(`Получено +${amount} XP!`);

    let rankChanged = false;
    if (player.level >= 10) {
      player.rank = 'Великий Шаман';
    } else if (player.level >= 6) {
      player.rank = 'Архивариус';
    } else if (player.level >= 3) {
      player.rank = 'Следопыт';
    } else {
      player.rank = 'Новичок';
    }

    if (player.level > oldLevel) {
      logs.push(`🎉 Повышение уровня! Ваш новый уровень: ${player.level} (${player.rank})!`);
    }
    
    if (oldRank !== player.rank) {
      rankChanged = true;
    }

    return {
      logs,
      levelUp: player.level > oldLevel,
      rankChanged
    };
  }
}
