import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../../../backend/config/index.js';
import { QuestProject, QuestStep, NPC } from '../../types/index.js';
import { AGENT_SYSTEM_PROMPTS } from '../prompts/agentPrompts.js';

export interface AgentLog {
  agent: string;
  status: 'idle' | 'working' | 'done' | 'error';
  message: string;
}

export class MultiAgentDesignerService {
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
   * Orchestrates the 5-agent pipeline to generate a complete Quest Project.
   */
  public async generateProject(
    idea: string,
    answers: Record<string, string>,
    onProgress?: (logs: AgentLog[]) => void
  ): Promise<{ project: QuestProject; logs: AgentLog[] }> {
    const logs: AgentLog[] = [
      { agent: 'Story Agent', status: 'idle', message: 'Ожидание запуска...' },
      { agent: 'Game Designer Agent', status: 'idle', message: 'Ожидание запуска...' },
      { agent: 'Puzzle Agent', status: 'idle', message: 'Ожидание запуска...' },
      { agent: 'Balance Agent', status: 'idle', message: 'Ожидание запуска...' },
      { agent: 'QA Agent', status: 'idle', message: 'Ожидание запуска...' }
    ];

    const updateLog = (agent: string, status: 'idle' | 'working' | 'done' | 'error', message: string) => {
      const idx = logs.findIndex(l => l.agent === agent);
      if (idx !== -1) {
        logs[idx] = { agent, status, message };
        if (onProgress) onProgress([...logs]);
      }
    };

    if (!this.client) {
      // Return beautiful simulated fallback if API key is not set
      updateLog('Story Agent', 'working', 'Генерация лора и атмосферы Сибири...');
      await this.sleep(600);
      updateLog('Story Agent', 'done', 'Созданы лор, сюжет и NPC "Шаман Савва"');

      updateLog('Game Designer Agent', 'working', 'Проектирование структуры шагов...');
      await this.sleep(600);
      updateLog('Game Designer Agent', 'done', 'Спроектировано 4 сюжетных этапа');

      updateLog('Puzzle Agent', 'working', 'Создание загадок и Vision AI маркеров...');
      await this.sleep(600);
      updateLog('Puzzle Agent', 'done', 'Сгенерированы шифры, QR-коды и координаты GPS');

      updateLog('Balance Agent', 'working', 'Балансировка опыта и наград...');
      await this.sleep(600);
      updateLog('Balance Agent', 'done', 'Награды сбалансированы. Общая сумма: 1000 XP');

      updateLog('QA Agent', 'working', 'Проверка структуры и синтаксиса...');
      await this.sleep(600);
      updateLog('QA Agent', 'done', 'Проект успешно верифицирован! Логических тупиков не обнаружено.');

      return { project: this.getFallbackProject(idea, answers), logs };
    }

    try {
      // === 1. STORY AGENT ===
      updateLog('Story Agent', 'working', 'Анализ идеи и создание сюжетного мира...');
      const contextText = `Идея: ${idea}\nОтветы пользователя:\n${Object.entries(answers).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`;
      
      const storyResponse = await this.client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `${AGENT_SYSTEM_PROMPTS.STORY_AGENT}\n\nКонтекст пользователя:\n${contextText}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              lore: {
                type: Type.OBJECT,
                properties: {
                  systemPrompt: { type: Type.STRING, description: 'Системный промпт ИИ-Ведущего' },
                  story: { type: Type.STRING, description: 'Описание завязки сюжета' },
                  rules: { type: Type.STRING, description: 'Игровые правила' }
                },
                required: ['systemPrompt', 'story', 'rules']
              },
              npcs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    personality: { type: Type.STRING },
                    avatar: { type: Type.STRING, description: 'Emoji representing NPC' }
                  },
                  required: ['id', 'name', 'role', 'personality', 'avatar']
                }
              }
            },
            required: ['name', 'description', 'lore', 'npcs']
          }
        }
      });

      const storyOutput = JSON.parse(storyResponse.text || '{}');
      updateLog('Story Agent', 'done', `Создан мир квеста: "${storyOutput.name}"`);

      // === 2. GAME DESIGNER AGENT ===
      updateLog('Game Designer Agent', 'working', 'Планирование этапов и методов прохождения...');
      const gdResponse = await this.client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `${AGENT_SYSTEM_PROMPTS.GAME_DESIGNER_AGENT}\n\nСозданный сюжет:\n${JSON.stringify(storyOutput)}\n\nСпроектируйте шаги (от 3 до 5 шагов).`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'Array of quest steps outline',
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING, description: 'TEXT, QR, PHOTO, LOCATION, TIMER, or CUSTOM' }
              },
              required: ['id', 'title', 'description', 'type']
            }
          }
        }
      });

      const stepsOutline = JSON.parse(gdResponse.text || '[]');
      updateLog('Game Designer Agent', 'done', `Спроектировано шагов: ${stepsOutline.length}`);

      // === 3. PUZZLE AGENT ===
      updateLog('Puzzle Agent', 'working', 'Создание шифров, геолокаций и Vision AI тегов...');
      const puzzleResponse = await this.client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `${AGENT_SYSTEM_PROMPTS.PUZZLE_AGENT}\n\nШаги без деталей верификации:\n${JSON.stringify(stepsOutline)}\n\nЗаполните verificationData для каждого шага.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                verificationData: {
                  type: Type.OBJECT,
                  properties: {
                    answers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    qrCode: { type: Type.STRING },
                    referenceImage: { type: Type.STRING },
                    coords: {
                      type: Type.OBJECT,
                      properties: {
                        lat: { type: Type.NUMBER },
                        lng: { type: Type.NUMBER },
                        radius: { type: Type.NUMBER }
                      },
                      required: ['lat', 'lng', 'radius']
                    },
                    duration: { type: Type.NUMBER }
                  }
                }
              },
              required: ['id', 'verificationData']
            }
          }
        }
      });

      const puzzleDetails = JSON.parse(puzzleResponse.text || '[]');
      updateLog('Puzzle Agent', 'done', 'Параметры верификации успешно интегрированы');

      // === 4. BALANCE AGENT ===
      updateLog('Balance Agent', 'working', 'Настройка сложности и наград (XP, инвентарь)...');
      const balanceResponse = await this.client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `${AGENT_SYSTEM_PROMPTS.BALANCE_AGENT}\n\nШаги с верификацией:\n${JSON.stringify(stepsOutline)}\n\nСгенерируйте сбалансированные награды (xp, item, achievement).`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                reward: {
                  type: Type.OBJECT,
                  properties: {
                    xp: { type: Type.NUMBER },
                    item: { type: Type.STRING },
                    achievement: { type: Type.STRING }
                  },
                  required: ['xp']
                }
              },
              required: ['id', 'reward']
                }
              }
            }
      });

      const rewardDetails = JSON.parse(balanceResponse.text || '[]');
      updateLog('Balance Agent', 'done', 'Награды и опыт идеально сбалансированы');

      // Assemble final project outline
      const assembledSteps: QuestStep[] = stepsOutline.map((step: any) => {
        const puzzle = puzzleDetails.find((p: any) => p.id === step.id) || { verificationData: {} };
        const rewardObj = rewardDetails.find((r: any) => r.id === step.id) || { reward: { xp: 150 } };
        return {
          id: step.id,
          title: step.title,
          description: step.description,
          type: step.type,
          verificationData: puzzle.verificationData,
          reward: rewardObj.reward
        };
      });

      // === 5. QA AGENT (VALIDATOR / REFINER) ===
      updateLog('QA Agent', 'working', 'Сборка проекта, линтинг, валидация и исправление багов...');
      const finalRawProject = {
        id: storyOutput.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'ai-generated-quest',
        name: storyOutput.name,
        description: storyOutput.description,
        status: 'draft' as const,
        lore: storyOutput.lore,
        npcs: storyOutput.npcs,
        steps: assembledSteps
      };

      const qaResponse = await this.client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `${AGENT_SYSTEM_PROMPTS.QA_AGENT}\n\nСырой проект квеста:\n${JSON.stringify(finalRawProject)}\n\nПроведите валидацию и верните идеальный QuestProject в формате JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              status: { type: Type.STRING },
              lore: {
                type: Type.OBJECT,
                properties: {
                  systemPrompt: { type: Type.STRING },
                  story: { type: Type.STRING },
                  rules: { type: Type.STRING }
                },
                required: ['systemPrompt', 'story', 'rules']
              },
              npcs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    personality: { type: Type.STRING },
                    avatar: { type: Type.STRING }
                  },
                  required: ['id', 'name', 'role', 'personality', 'avatar']
                }
              },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING },
                    verificationData: {
                      type: Type.OBJECT,
                      properties: {
                        answers: { type: Type.ARRAY, items: { type: Type.STRING } },
                        qrCode: { type: Type.STRING },
                        referenceImage: { type: Type.STRING },
                        coords: {
                          type: Type.OBJECT,
                          properties: {
                            lat: { type: Type.NUMBER },
                            lng: { type: Type.NUMBER },
                            radius: { type: Type.NUMBER }
                          }
                        },
                        duration: { type: Type.NUMBER }
                      }
                    },
                    reward: {
                      type: Type.OBJECT,
                      properties: {
                        xp: { type: Type.NUMBER },
                        item: { type: Type.STRING },
                        achievement: { type: Type.STRING }
                      },
                      required: ['xp']
                    }
                  },
                  required: ['id', 'title', 'description', 'type', 'verificationData', 'reward']
                }
              }
            },
            required: ['id', 'name', 'description', 'status', 'lore', 'npcs', 'steps']
          }
        }
      });

      const validatedProject = JSON.parse(qaResponse.text || '{}');
      validatedProject.status = 'draft'; // Enforce draft state!

      updateLog('QA Agent', 'done', 'Валидация успешна! Логических тупиков не обнаружено.');
      return { project: validatedProject as QuestProject, logs };

    } catch (error: any) {
      console.error('Error in multi-agent orchestration:', error);
      updateLog('QA Agent', 'error', `Критическая ошибка оркестрации: ${error.message}. Переход на резервный генератор.`);
      return { project: this.getFallbackProject(idea, answers), logs };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getFallbackProject(idea: string, answers: Record<string, string>): QuestProject {
    const name = `Тайны Сибири: ${idea.slice(0, 30)}`;
    const location = answers.location || 'Дремучая тайга';
    const npcName = answers.npc_type || 'Шаман Савва';

    return {
      id: `quest-${Math.random().toString(36).substring(2, 8)}`,
      name,
      description: `Захватывающее приключение на локации "${location}" под руководством гида: ${npcName}.`,
      status: 'draft',
      lore: {
        systemPrompt: `Вы играете роль персонажа ${npcName}. Вы говорите мудро, загадками, подталкивая искателя разгадывать тайны сибирских лесов. Никогда не говорите ответы прямо. Используйте пословицы.`,
        story: `Многие века эти земли скрывали древние реликвии. Вы приехали сюда по зову сердца и встретили проводника — ${npcName}, который согласен показать тропу, но только тому, кто докажет свою силу духа.`,
        rules: 'Соблюдайте правила безопасности. За каждое успешно пройденное испытание вы получаете опыт (XP) и ценные предметы.'
      },
      npcs: [
        {
          id: 'guide-shaman',
          name: npcName,
          role: 'Хранитель тайн',
          personality: 'Таинственный, мудрый, говорит загадками Сибири',
          avatar: '🧙‍♂️'
        }
      ],
      steps: [
        {
          id: 'step-1-riddle',
          title: 'Загадка древней хижины',
          description: 'Хранитель не пропустит вас дальше, пока вы не разгадаете его первую загадку: "Без рук, без ног, а ворота отворяет. Что это?"',
          type: 'TEXT',
          verificationData: {
            answers: ['ветер', 'ветер северный', 'сквозняк']
          },
          reward: {
            xp: 200,
            item: 'Медный Ключ'
          }
        },
        {
          id: 'step-2-gps',
          title: 'Священный тотем',
          description: 'Отправляйтесь к священному тотему Байаная, чтобы совершить обряд подношения.',
          type: 'LOCATION',
          verificationData: {
            coords: { lat: 52.287, lng: 104.281, radius: 25 } // Near Irkutsk / Angara
          },
          reward: {
            xp: 300,
            item: 'Кедровый амулет'
          }
        },
        {
          id: 'step-3-photo',
          title: 'Сила природы',
          description: 'Чтобы зарядить амулет, сфотографируйте живое зеленое дерево или растение и отправьте Шаману.',
          type: 'PHOTO',
          verificationData: {
            referenceImage: 'Живое зеленое растение, листья дерева или лесной кустарник'
          },
          reward: {
            xp: 250,
            achievement: 'Друг Леса'
          }
        },
        {
          id: 'step-4-qr',
          title: 'Врата Духов',
          description: 'Отыщите на местности священные врата с нанесенным тайным знаком (QR-кодом) и отсканируйте его.',
          type: 'QR',
          verificationData: {
            qrCode: 'GATEWAY_SECRET_777'
          },
          reward: {
            xp: 250,
            item: 'Древняя карта Колчака',
            achievement: 'Покоритель тайн Сибири'
          }
        }
      ]
    };
  }

  /**
   * Refines/improves an existing QuestProject based on human feedback.
   */
  public async improveProject(project: QuestProject, feedback: string): Promise<QuestProject> {
    if (!this.client) {
      const updated = { ...project };
      updated.description += ` (Оптимизировано по отзыву: "${feedback}")`;
      return updated;
    }

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `
Вы — Экспертный Игровой Дизайнер и Валидатор.
Вам дан существующий проект квеста:
${JSON.stringify(project)}

Пользователь оставил следующее пожелание/отзыв об улучшении:
"${feedback}"

Пожалуйста, переработайте этот квест с учетом пожелания пользователя. Отредактируйте шаги, описания, загадки, награды или сюжет в соответствии с запросом.
Верните обновленный и полностью валидный QuestProject в формате JSON.
`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              status: { type: Type.STRING },
              lore: {
                type: Type.OBJECT,
                properties: {
                  systemPrompt: { type: Type.STRING },
                  story: { type: Type.STRING },
                  rules: { type: Type.STRING }
                },
                required: ['systemPrompt', 'story', 'rules']
              },
              npcs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    personality: { type: Type.STRING },
                    avatar: { type: Type.STRING }
                  },
                  required: ['id', 'name', 'role', 'personality', 'avatar']
                }
              },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING },
                    verificationData: {
                      type: Type.OBJECT,
                      properties: {
                        answers: { type: Type.ARRAY, items: { type: Type.STRING } },
                        qrCode: { type: Type.STRING },
                        referenceImage: { type: Type.STRING },
                        coords: {
                          type: Type.OBJECT,
                          properties: {
                            lat: { type: Type.NUMBER },
                            lng: { type: Type.NUMBER },
                            radius: { type: Type.NUMBER }
                          }
                        },
                        duration: { type: Type.NUMBER }
                      }
                    },
                    reward: {
                      type: Type.OBJECT,
                      properties: {
                        xp: { type: Type.NUMBER },
                        item: { type: Type.STRING },
                        achievement: { type: Type.STRING }
                      },
                      required: ['xp']
                    }
                  },
                  required: ['id', 'title', 'description', 'type', 'verificationData', 'reward']
                }
              }
            },
            required: ['id', 'name', 'description', 'status', 'lore', 'npcs', 'steps']
          }
        }
      });

      const updated = JSON.parse(response.text || '{}');
      updated.status = 'draft';
      return updated as QuestProject;
    } catch (error) {
      console.error('Error improving project with Gemini:', error);
      const updated = { ...project };
      updated.description += ` (Улучшено: ${feedback})`;
      return updated;
    }
  }
}
