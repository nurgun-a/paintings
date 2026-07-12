import { QuestProject, QuestStep } from '../../types/index.js';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  stepId?: string;
  field: string;
  message: string;
}

export class LogicalValidator {
  /**
   * Validates a QuestProject for logical gaps, dead-ends, and syntax warnings.
   */
  public static validate(project: QuestProject): { isValid: boolean; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];

    // 1. Basic project info
    if (!project.name.trim()) {
      issues.push({ severity: 'error', field: 'name', message: 'Название проекта не должно быть пустым.' });
    }
    if (!project.description.trim()) {
      issues.push({ severity: 'warning', field: 'description', message: 'Описание проекта пустое — игроки не поймут сути.' });
    }

    // 2. Lore
    if (!project.lore.story.trim()) {
      issues.push({ severity: 'error', field: 'lore.story', message: 'Основная сюжетная история пуста.' });
    }
    if (!project.lore.systemPrompt.trim()) {
      issues.push({ severity: 'warning', field: 'lore.systemPrompt', message: 'Системный промпт ИИ-Ведущего пуст — отыгрыш роли будет стандартным.' });
    }

    // 3. NPCs
    if (!project.npcs || project.npcs.length === 0) {
      issues.push({ severity: 'error', field: 'npcs', message: 'В проекте отсутствует хотя бы один ИИ-Проводник (NPC).' });
    } else {
      project.npcs.forEach((npc, idx) => {
        if (!npc.name.trim()) {
          issues.push({ severity: 'error', field: `npcs[${idx}].name`, message: `У NPC #${idx + 1} не задано имя.` });
        }
        if (!npc.avatar.trim()) {
          issues.push({ severity: 'warning', field: `npcs[${idx}].avatar`, message: `У NPC "${npc.name}" нет аватара/эмодзи.` });
        }
      });
    }

    // 4. Steps
    if (!project.steps || project.steps.length === 0) {
      issues.push({ severity: 'error', field: 'steps', message: 'В квесте нет ни одного шага! Игроки не смогут играть.' });
    } else {
      project.steps.forEach((step, idx) => {
        const stepName = step.title || `Шаг ${idx + 1}`;
        
        if (!step.title.trim()) {
          issues.push({ severity: 'error', stepId: step.id, field: `steps[${idx}].title`, message: `У шага #${idx + 1} отсутствует название.` });
        }
        if (!step.description.trim()) {
          issues.push({ severity: 'error', stepId: step.id, field: `steps[${idx}].description`, message: `Описание шага "${stepName}" пустое.` });
        }

        // Verification validation
        const vData = step.verificationData || {};
        switch (step.type) {
          case 'TEXT':
            if (!vData.answers || vData.answers.length === 0) {
              issues.push({
                severity: 'error',
                stepId: step.id,
                field: `steps[${idx}].verificationData.answers`,
                message: `На шаге "${stepName}" (ввод текста) отсутствует список правильных ответов.`
              });
            } else {
              vData.answers.forEach((ans, aIdx) => {
                if (!ans.trim()) {
                  issues.push({
                    severity: 'error',
                    stepId: step.id,
                    field: `steps[${idx}].verificationData.answers[${aIdx}]`,
                    message: `На шаге "${stepName}" обнаружен пустой вариант ответа.`
                  });
                }
              });
            }
            break;

          case 'QR':
            if (!vData.qrCode || !vData.qrCode.trim()) {
              issues.push({
                severity: 'error',
                stepId: step.id,
                field: `steps[${idx}].verificationData.qrCode`,
                message: `На шаге "${stepName}" (сканирование QR) не задано проверочное значение QR-кода.`
              });
            }
            break;

          case 'PHOTO':
            if (!vData.referenceImage || !vData.referenceImage.trim()) {
              issues.push({
                severity: 'error',
                stepId: step.id,
                field: `steps[${idx}].verificationData.referenceImage`,
                message: `На шаге "${stepName}" (фотоконтроль) не задано текстовое описание эталонного объекта.`
              });
            }
            break;

          case 'LOCATION':
            if (!vData.coords || typeof vData.coords.lat !== 'number' || typeof vData.coords.lng !== 'number') {
              issues.push({
                severity: 'error',
                stepId: step.id,
                field: `steps[${idx}].verificationData.coords`,
                message: `На шаге "${stepName}" (геолокация) заданы некорректные GPS координаты.`
              });
            } else {
              const radius = vData.coords.radius || 0;
              if (radius < 10) {
                issues.push({
                  severity: 'warning',
                  stepId: step.id,
                  field: `steps[${idx}].verificationData.coords.radius`,
                  message: `На шаге "${stepName}" радиус GPS погрешности (${radius}м) слишком мал. Рекомендуется от 15м.`
                });
              }
            }
            break;

          case 'TIMER':
            if (!vData.duration || vData.duration <= 0) {
              issues.push({
                severity: 'error',
                stepId: step.id,
                field: `steps[${idx}].verificationData.duration`,
                message: `На шаге на время "${stepName}" задано некорректное время ожидания.`
              });
            }
            break;
        }

        // Rewards
        if (!step.reward || typeof step.reward.xp !== 'number' || step.reward.xp < 0) {
          issues.push({
            severity: 'error',
            stepId: step.id,
            field: `steps[${idx}].reward.xp`,
            message: `На шаге "${stepName}" задано некорректное количество XP.`
          });
        } else if (step.reward.xp === 0) {
          issues.push({
            severity: 'warning',
            stepId: step.id,
            field: `steps[${idx}].reward.xp`,
            message: `За прохождение шага "${stepName}" начисляется 0 XP.`
          });
        }
      });
    }

    const hasErrors = issues.some(i => i.severity === 'error');
    return {
      isValid: !hasErrors,
      issues
    };
  }
}
