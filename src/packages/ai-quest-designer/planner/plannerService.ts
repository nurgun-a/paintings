import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../../../backend/config/index.js';
import { DesignerQuestion } from '../types.js';

export class AIQuestPlannerService {
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

  /**
   * Generates a list of custom clarifying questions based on a raw user idea.
   */
  public async generateQuestions(idea: string): Promise<DesignerQuestion[]> {
    if (!this.client) {
      // Fallback questions if API key is not configured
      return this.getFallbackQuestions(idea);
    }

    try {
      const prompt = `
Вы — AI Quest Planner. Пользователь хочет создать квест со следующей идеей: "${idea}".
Сгенерируйте ровно 3-4 умных, вовлекающих уточняющих вопроса, которые помогут мультиагентной системе создать идеальный сценарий, шаги, атмосферу и сбалансированные загадки.
Вопросы должны касаться:
1. Конкретного места проведения (город, лес, заброшенная база).
2. Мистического/атмосферного уклона или исторических фактов.
3. Основного NPC, который будет вести игрока (добрый дух, ворчливый егерь, кибер-сталкер).
4. Предпочитаемого стиля заданий (загадки на смекалку, ориентирование по GPS, фотоохота на артефакты).

Результат должен строго соответствовать JSON-схеме и содержать массив вопросов.
`;

      const response = await this.client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'Array of clarifying questions',
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: 'Unique simple key like location, vibe, npc, task_type' },
                field: { type: Type.STRING, description: 'Field name matching the key' },
                questionText: { type: Type.STRING, description: 'The actual engaging clarifying question in Russian' },
                placeholder: { type: Type.STRING, description: 'An example answer suggestion in Russian' },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Optional list of 3-4 suggested options/answers'
                }
              },
              required: ['id', 'field', 'questionText', 'placeholder']
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from Gemini');
      
      const parsed = JSON.parse(text);
      return parsed as DesignerQuestion[];
    } catch (error) {
      console.error('Error generating questions from Gemini:', error);
      return this.getFallbackQuestions(idea);
    }
  }

  private getFallbackQuestions(idea: string): DesignerQuestion[] {
    return [
      {
        id: 'location',
        field: 'location',
        questionText: 'Где будет проходить квест? (например: таежный лес, заброшенный советский бункер, улицы Иркутска, или онлайн)',
        placeholder: 'улицы Иркутска и берег Ангары',
        options: ['Дремучая тайга', 'Заброшенный научный бункер', 'Городские улочки', 'Старинная усадьба']
      },
      {
        id: 'npc_type',
        field: 'npc_type',
        questionText: 'Каким вы видите главного NPC-проводника, который будет общаться с игроком в чате?',
        placeholder: 'Древний шаман, говорящий загадками и пословицами',
        options: ['Мудрый таежный шаман', 'ИИ-Бортовой компьютер', 'Потерявшийся во времени сталкер', 'Таинственный хранитель музея']
      },
      {
        id: 'vibe',
        field: 'vibe',
        questionText: 'Какую атмосферу квеста вы хотите задать?',
        placeholder: 'Мистика, древние духи Сибири, таинственные знаки',
        options: ['Мистический детектив', 'Экстремальное выживание', 'Историческое расследование', 'Техногенный апокалипсис']
      },
      {
        id: 'mechanic',
        field: 'mechanic',
        questionText: 'Какие механики заданий должны доминировать?',
        placeholder: 'Текстовые шифры и фотографирование природных объектов',
        options: ['Текстовые загадки и шифры', 'GPS ориентирование', 'Фотоохота на артефакты (Vision AI)', 'Смешанный тип (все вместе)']
      }
    ];
  }
}
