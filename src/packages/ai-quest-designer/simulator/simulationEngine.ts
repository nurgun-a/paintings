import { QuestProject, QuestStep } from '../../types/index.js';
import { SimulationResult, SimulationLog } from '../types.js';

export class SimulationEngine {
  /**
   * Simulates a playthrough of the quest by a player with a specific persona.
   */
  public static async simulatePlaythrough(
    project: QuestProject,
    persona: 'Beginner' | 'Normal' | 'Expert'
  ): Promise<SimulationResult> {
    const logs: SimulationLog[] = [];
    const issuesFound: string[] = [];
    
    let currentStepIndex = 0;
    const totalSteps = project.steps?.length || 0;
    let durationMinutes = 0;

    const npcName = project.npcs[0]?.name || 'Проводник';

    // Step 0: Joined
    logs.push({
      timestamp: this.formatTime(durationMinutes),
      sender: 'system',
      text: `[СИМУЛЯЦИЯ: ${persona}] Игрок присоединился к квесту "${project.name}"`,
      stepIndex: -1
    });

    logs.push({
      timestamp: this.formatTime(durationMinutes),
      sender: 'gamemaster',
      text: `[${npcName}]: Приветствую тебя в игре! Твой путь лежит через "${project.description}". Прочитай историю: "${project.lore.story}". Ты готов начать?`,
      stepIndex: -1
    });

    durationMinutes += persona === 'Beginner' ? 5 : persona === 'Normal' ? 3 : 1;

    logs.push({
      timestamp: this.formatTime(durationMinutes),
      sender: 'player',
      text: `Да, я готов. Начинаем приключение!`,
      stepIndex: -1
    });

    if (totalSteps === 0) {
      issuesFound.push('Квест не имеет шагов для тестирования.');
      return {
        persona,
        success: false,
        stepsCompleted: 0,
        totalSteps: 0,
        logs,
        issuesFound,
        durationMinutes
      };
    }

    // Iterate steps
    for (let i = 0; i < totalSteps; i++) {
      const step = project.steps[i];
      currentStepIndex = i;

      logs.push({
        timestamp: this.formatTime(durationMinutes),
        sender: 'system',
        text: `--- Этап #${i + 1}: "${step.title}" (${step.type}) ---`,
        stepIndex: i
      });

      logs.push({
        timestamp: this.formatTime(durationMinutes),
        sender: 'gamemaster',
        text: `[${npcName}]: Твое испытание: ${step.description}`,
        stepIndex: i
      });

      // Simulation delay based on step type & persona
      let solved = false;
      let attempts = 0;

      if (step.type === 'TEXT') {
        const answers = step.verificationData.answers || [];
        if (answers.length === 0) {
          issuesFound.push(`Шаг ${i + 1} (${step.title}): Отсутствуют правильные ответы для текстового задания.`);
          logs.push({
            timestamp: this.formatTime(durationMinutes),
            sender: 'system',
            text: `[КРИТИЧЕСКИЙ ТУПИК]: Игрок не может ввести верный ответ, так как список ответов пуст!`,
            stepIndex: i,
            success: false
          });
          break;
        }

        const correctAnswer = answers[0];

        if (persona === 'Beginner') {
          // Beginner makes typos and wrong guesses
          attempts = 3;
          logs.push({
            timestamp: this.formatTime(durationMinutes + 3),
            sender: 'player',
            text: `Наверное, это какая-то подсказка типа "солнце"?`,
            stepIndex: i
          });
          logs.push({
            timestamp: this.formatTime(durationMinutes + 4),
            sender: 'gamemaster',
            text: `[${npcName}]: Хм, нет. Подумай глубже. Древние духи не приняли бы такой простой ответ.`,
            stepIndex: i
          });
          
          logs.push({
            timestamp: this.formatTime(durationMinutes + 8),
            sender: 'player',
            text: `Может быть, ответ — это "${correctAnswer.toUpperCase()}"?`,
            stepIndex: i
          });
          durationMinutes += 10;
          solved = true;
        } else if (persona === 'Normal') {
          attempts = 1;
          logs.push({
            timestamp: this.formatTime(durationMinutes + 2),
            sender: 'player',
            text: `Мне кажется, ответ: ${correctAnswer}`,
            stepIndex: i
          });
          durationMinutes += 4;
          solved = true;
        } else {
          // Expert solves immediately
          logs.push({
            timestamp: this.formatTime(durationMinutes + 1),
            sender: 'player',
            text: correctAnswer,
            stepIndex: i
          });
          durationMinutes += 1.5;
          solved = true;
        }

      } else if (step.type === 'QR') {
        const qr = step.verificationData.qrCode || '';
        if (!qr) {
          issuesFound.push(`Шаг ${i + 1} (${step.title}): Пустой QR-код.`);
        }
        
        const walkTime = persona === 'Beginner' ? 15 : persona === 'Normal' ? 10 : 5;
        durationMinutes += walkTime;
        
        logs.push({
          timestamp: this.formatTime(durationMinutes),
          sender: 'player',
          text: `[Отсканирован QR-код со значением: "${qr}"]`,
          stepIndex: i
        });
        solved = true;

      } else if (step.type === 'PHOTO') {
        const refImg = step.verificationData.referenceImage || 'объект';
        const walkTime = persona === 'Beginner' ? 20 : persona === 'Normal' ? 12 : 7;
        durationMinutes += walkTime;

        logs.push({
          timestamp: this.formatTime(durationMinutes),
          sender: 'player',
          text: `[Загружен снимок объекта для Vision AI: "${refImg}"]`,
          stepIndex: i
        });

        // Simulate random similarity match (always pass in simulation for normal/expert, minor fail for beginner)
        if (persona === 'Beginner') {
          logs.push({
            timestamp: this.formatTime(durationMinutes + 2),
            sender: 'system',
            text: `[Vision AI]: Анализ снимка. Сходство 71%. Фото отклонено. Требуется более четкий ракурс.`,
            stepIndex: i
          });
          durationMinutes += 5;
          logs.push({
            timestamp: this.formatTime(durationMinutes),
            sender: 'player',
            text: `[Загружен повторный снимок с лучшим освещением]`,
            stepIndex: i
          });
        }

        const simScore = persona === 'Expert' ? 96 : persona === 'Normal' ? 88 : 84;
        logs.push({
          timestamp: this.formatTime(durationMinutes + 1),
          sender: 'system',
          text: `[Vision AI]: Сходство ${simScore}% с эталоном "${refImg}". Успешное распознавание!`,
          stepIndex: i
        });
        
        durationMinutes += 2;
        solved = true;

      } else if (step.type === 'LOCATION') {
        const coords = step.verificationData.coords || { lat: 52.287, lng: 104.281, radius: 20 };
        const distTime = persona === 'Beginner' ? 18 : persona === 'Normal' ? 10 : 6;
        durationMinutes += distTime;

        logs.push({
          timestamp: this.formatTime(durationMinutes),
          sender: 'player',
          text: `[Перемещение по GPS координатам: широта ${coords.lat.toFixed(4)}, долгота ${coords.lng.toFixed(4)}]`,
          stepIndex: i
        });

        logs.push({
          timestamp: this.formatTime(durationMinutes + 1),
          sender: 'system',
          text: `[GPS Проверка]: Игрок находится в радиусе ${coords.radius}м от точки. Координаты подтверждены.`,
          stepIndex: i
        });

        durationMinutes += 2;
        solved = true;

      } else {
        // Fallback or Timer
        const waitTime = step.verificationData.duration || 5;
        durationMinutes += waitTime / 60;
        logs.push({
          timestamp: this.formatTime(durationMinutes),
          sender: 'system',
          text: `Таймер на ${waitTime} сек. успешно истек.`,
          stepIndex: i
        });
        solved = true;
      }

      if (solved) {
        logs.push({
          timestamp: this.formatTime(durationMinutes),
          sender: 'system',
          text: `✅ Задание "${step.title}" успешно выполнено! Начислено +${step.reward.xp} XP.`,
          stepIndex: i,
          success: true
        });

        if (step.reward.item) {
          logs.push({
            timestamp: this.formatTime(durationMinutes),
            sender: 'system',
            text: `🎒 Игрок положил в рюкзак: "${step.reward.item}"`,
            stepIndex: i
          });
        }
        if (step.reward.achievement) {
          logs.push({
            timestamp: this.formatTime(durationMinutes),
            sender: 'system',
            text: `🏆 Игрок заслужил достижение: "${step.reward.achievement}"`,
            stepIndex: i
          });
        }
      } else {
        break;
      }
    }

    const success = currentStepIndex === totalSteps - 1;

    if (success) {
      logs.push({
        timestamp: this.formatTime(durationMinutes),
        sender: 'gamemaster',
        text: `[${npcName}]: Невероятно! Ты прошел все испытания и разгадал древние легенды. Твое путешествие завершено!`,
        stepIndex: totalSteps
      });
      logs.push({
        timestamp: this.formatTime(durationMinutes),
        sender: 'system',
        text: `🎉 Квест успешно завершен за ${Math.round(durationMinutes)} минут!`,
        stepIndex: totalSteps
      });
    }

    return {
      persona,
      success,
      stepsCompleted: success ? totalSteps : currentStepIndex,
      totalSteps,
      logs,
      issuesFound,
      durationMinutes: Math.round(durationMinutes)
    };
  }

  private static formatTime(minutes: number): string {
    const startHour = 12;
    const startMin = 0;
    const totalMinutes = startMin + Math.floor(minutes);
    const h = (startHour + Math.floor(totalMinutes / 60)) % 24;
    const m = totalMinutes % 60;
    const s = Math.floor((minutes % 1) * 60);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
}
