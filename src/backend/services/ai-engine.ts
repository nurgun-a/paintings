import { GoogleGenAI } from '@google/genai';
import { QuestProject, PlayerProfile } from '../../packages/types/index.js';
import { config } from '../config/index.js';

export interface AIStrategy {
  generate(systemPrompt: string, history: Array<{ role: 'user' | 'model'; text: string }>, prompt: string): Promise<string>;
}

// 1. GEMINI MODEL STRATEGY (Active production standard via Google SDK)
export class GeminiStrategy implements AIStrategy {
  private client: GoogleGenAI | null = null;

  constructor() {
    if (config.geminiApiKey) {
      this.client = new GoogleGenAI({
        apiKey: config.geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
  }

  async generate(systemPrompt: string, history: Array<{ role: 'user' | 'model'; text: string }>, prompt: string): Promise<string> {
    if (!this.client) {
      return `[Simulation Strategy: Gemini] Gemini API Key is unconfigured. Response fallback: Hello Traveler! Continue your path.`;
    }
    try {
      const contents = [
        { role: 'user' as const, parts: [{ text: systemPrompt }] },
        ...history.map(h => ({
          role: h.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: h.text }]
        })),
        { role: 'user' as const, parts: [{ text: prompt }] }
      ];

      const res = await this.client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents
      });

      return res.text || '...Шаман молчит... Попробуйте еще раз.';
    } catch (e: any) {
      console.error('Gemini Strategy Error:', e);
      return `[ИИ-Ведущий временно недоступен: ${e.message}]`;
    }
  }
}

// 2. OPENAI STRATEGY
export class OpenAIStrategy implements AIStrategy {
  async generate(systemPrompt: string, history: Array<{ role: 'user' | 'model'; text: string }>, prompt: string): Promise<string> {
    console.log('[AI Strategy: OpenAI triggered]');
    return `[ИИ-Ведущий (OpenAI)]: Прокладываю путь через тайгу для искателя...`;
  }
}

// 3. ANTHROPIC STRATEGY
export class AnthropicStrategy implements AIStrategy {
  async generate(systemPrompt: string, history: Array<{ role: 'user' | 'model'; text: string }>, prompt: string): Promise<string> {
    console.log('[AI Strategy: Anthropic triggered]');
    return `[ИИ-Ведущий (Anthropic)]: Древние тропы лежат перед вами...`;
  }
}

// --- CONTEXT BUILDER (DDD Core Domain Service) ---
export class ContextBuilder {
  public static buildSystemContext(project: QuestProject, player: PlayerProfile): string {
    return `
Вы играете роль таинственного ведущего и NPC: ${project.npcs[0]?.name || 'Таинственный Шаман'}.
Отыгрываемая роль: ${project.npcs[0]?.role || 'Gamemaster'}.
Личность персонажа: ${project.npcs[0]?.personality || 'Ведет игрока сквозь сюжет'}
Инструкция системы: ${project.lore.systemPrompt}
Сюжет мира квеста: ${project.lore.story}
Правила квеста: ${project.lore.rules}

--- ДАННЫЕ О ТЕКУЩЕМ ИГРОКЕ ---
Имя игрока: ${player.username}
Уровень силы: ${player.level}
Ранг/Звание: ${player.rank}
Рюкзак/Инвентарь игрока: ${player.inventory.join(', ') || 'Пусто'}
Достижения игрока: ${player.achievements.join(', ') || 'Нет'}

Правило ведения игры: Вы ведете общение строго от лица персонажа. Не раскрывайте секреты и коды проверки напрямую. Давайте таинственные подсказки.
`;
  }
}

import { AIEngineModule } from '../../packages/ai-engine/index.js';

// Unified Factory Engine
export class AIEngineService {
  private engine = AIEngineModule.getInstance();

  public async getAIResponse(
    provider: 'gemini' | 'openai' | 'anthropic' | 'deepseek',
    project: QuestProject,
    player: PlayerProfile,
    history: Array<{ role: 'user' | 'model'; text: string }>,
    userMessage: string
  ): Promise<string> {
    try {
      const result = await this.engine.processChat(project, player, userMessage, [], { provider });
      return result.message;
    } catch (e: any) {
      console.error('Core AI Engine Service failure, running fallback strategy:', e);
      const strategy = new GeminiStrategy();
      const systemPrompt = ContextBuilder.buildSystemContext(project, player);
      return strategy.generate(systemPrompt, history, userMessage);
    }
  }
}
