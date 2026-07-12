import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../../../backend/config/index.js';
import { QuestProject } from '../../types/index.js';
import { AIReviewReport, SimulationResult } from '../types.js';

export class AIFeedbackOptimizer {
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
   * Generates a multi-agent review report evaluating strengths, vulnerabilities, and giving recommendations.
   */
  public async reviewQuest(
    project: QuestProject,
    simResults: SimulationResult[]
  ): Promise<AIReviewReport> {
    if (!this.client) {
      return this.generateLocalReview(project, simResults);
    }

    try {
      const prompt = `
Вы — Мультиагентная Экспертная Группа аудита квестов (Story, Game Designer, Puzzle, Balance, QA Agents).
Проанализируйте следующий квест и результаты его симуляции игроками разного уровня:

Квест: ${JSON.stringify(project)}
Результаты симуляций: ${JSON.stringify(simResults)}

Сформируйте профессиональный отчет об аудите квеста в формате JSON.
Выделите:
1. Сильные стороны (strengths) — что сделано отлично (лор, баланс, разнообразие механик).
2. Уязвимости (vulnerabilities) — узкие места, где игроки могут застрять.
3. Риски (risks) — риски в реальном мире (GPS в тайге, плохой свет для Vision AI, слишком длинный таймер).
4. Рекомендации по оптимизации (recommendations) — конкретные советы по улучшению.
5. Общую оценку (overallScore) от 0 до 100.

Ваш ответ должен строго соответствовать JSON-схеме.
`;

      const response = await this.client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              vulnerabilities: { type: Type.ARRAY, items: { type: Type.STRING } },
              risks: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              overallScore: { type: Type.INTEGER }
            },
            required: ['strengths', 'vulnerabilities', 'risks', 'recommendations', 'overallScore']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty review response');

      return JSON.parse(text) as AIReviewReport;
    } catch (e) {
      console.error('Error generating AI review:', e);
      return this.generateLocalReview(project, simResults);
    }
  }

  private generateLocalReview(project: QuestProject, simResults: SimulationResult[]): AIReviewReport {
    const strengths: string[] = [];
    const vulnerabilities: string[] = [];
    const risks: string[] = [];
    const recommendations: string[] = [];
    let score = 85;

    // Strengths
    strengths.push(`Увлекательный сибирский сеттинг с проработанной завязкой: "${project.name}"`);
    if (project.npcs && project.npcs.length > 0) {
      strengths.push(`Наличие харизматичного ИИ-Проводника: "${project.npcs[0].name}" (${project.npcs[0].role})`);
    }
    const stepTypes = new Set(project.steps?.map(s => s.type) || []);
    if (stepTypes.size >= 3) {
      strengths.push(`Высокое разнообразие механик проверки (${stepTypes.size} разных типов: ${Array.from(stepTypes).join(', ')})`);
    } else {
      vulnerabilities.push('Малое разнообразие игровых механик (рекомендуется разбавить GPS или Vision AI)');
      score -= 5;
    }

    // Vulnerabilities & Risks based on step types
    project.steps?.forEach((step, idx) => {
      if (step.type === 'TEXT') {
        const ansCount = step.verificationData.answers?.length || 0;
        if (ansCount === 1) {
          vulnerabilities.push(`Шаг "${step.title}": Задана всего одна строка ответа. Игрок может сделать опечатку.`);
          recommendations.push(`Добавьте синонимы и альтернативные варианты написания для ответа на шаге "${step.title}".`);
          score -= 2;
        }
      }
      if (step.type === 'LOCATION') {
        risks.push(`Шаг "${step.title}": Использование спутниковой геолокации. Возможны перебои со связью в лесу/тайге.`);
        recommendations.push(`Сделайте радиус погрешности на GPS шаге "${step.title}" не менее 25-30 метров для стабильности.`);
      }
      if (step.type === 'PHOTO') {
        risks.push(`Шаг "${step.title}": Камера и Vision AI сильно зависят от уровня освещения и времени суток.`);
        recommendations.push(`Убедитесь, что эталонное описание на шаге "${step.title}" не содержит субъективных оценок.`);
      }
    });

    // Check simulation outcomes
    const beginnerRun = simResults.find(r => r.persona === 'Beginner');
    if (beginnerRun && !beginnerRun.success) {
      vulnerabilities.push('Симуляция Новичка потерпела неудачу. Игрок застрял на одном из этапов.');
      recommendations.push('Упростите описания загадок или добавьте автоматические подсказки-фидбеки от ИИ-Ведущего.');
      score -= 10;
    } else if (beginnerRun && beginnerRun.durationMinutes > 40) {
      vulnerabilities.push(`Симуляция Новичка заняла слишком много времени (${beginnerRun.durationMinutes} мин), возможна потеря вовлечения.`);
      score -= 5;
    }

    if (strengths.length === 0) strengths.push('Логическая структура квеста корректна и готова к тестам.');
    if (recommendations.length === 0) recommendations.push('Квест отлично сбалансирован, можно публиковать!');

    return {
      strengths,
      vulnerabilities,
      risks,
      recommendations,
      overallScore: Math.max(40, Math.min(100, score))
    };
  }
}
