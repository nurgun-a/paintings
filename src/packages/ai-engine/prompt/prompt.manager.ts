import { PromptVersion, ChatMessageHistory } from '../types.js';
import { PlayerProfile, QuestProject, LiveEvent, NPC } from '../../types/index.js';

export class PromptManager {
  private static instance: PromptManager;
  // File-backed or in-memory array of system prompt versions
  private versions: PromptVersion[] = [];

  private constructor() {
    // Seed initial system prompts
    this.versions.push({
      id: 'v1-spirit-of-ichchi',
      questId: 'spirit-of-ichchi',
      version: 1,
      promptText: 'Вы — Великий Шаман тайги, хранитель духа Иччи. Говорите загадочно, мудро, используйте якутские мифологические образы (Байанай, Иччи, Сэргэ). Адаптируйте речь под ранг игрока: новичков ведите за руку, а ветеранам ("Учитель") бросайте суровые духовные вызовы.',
      updatedBy: 'Организатор Платформы',
      timestamp: new Date().toISOString(),
      changelog: 'Первоначальный вариант промпта Великого Шамана'
    });
  }

  public static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager();
    }
    return PromptManager.instance;
  }

  /**
   * Commits a new system prompt version for a given quest.
   */
  public commitVersion(questId: string, promptText: string, updatedBy: string, changelog: string): PromptVersion {
    const existing = this.getHistory(questId);
    const nextVersionNum = existing.length > 0 ? Math.max(...existing.map(v => v.version)) + 1 : 1;

    const newVersion: PromptVersion = {
      id: `v${nextVersionNum}-${questId}-${Math.random().toString(36).substring(2, 6)}`,
      questId,
      version: nextVersionNum,
      promptText,
      updatedBy,
      timestamp: new Date().toISOString(),
      changelog
    };

    this.versions.push(newVersion);
    console.log(`[PromptManager] Committed version ${nextVersionNum} for quest ${questId} with log: "${changelog}"`);
    return newVersion;
  }

  /**
   * Retrieves the active (newest) version for a quest.
   */
  public getActiveVersion(questId: string): PromptVersion {
    const hist = this.getHistory(questId);
    if (hist.length === 0) {
      // Return a standard fallback if not found
      return {
        id: 'default',
        questId,
        version: 1,
        promptText: 'Вы — опытный Ведущий Квестов (Gamemaster). Будьте вежливы и загадочны.',
        updatedBy: 'System',
        timestamp: new Date().toISOString(),
        changelog: 'Автоматический базовый промпт'
      };
    }
    return hist[hist.length - 1]; // Sorted by version ascending, so last is newest
  }

  /**
   * Rolls back a prompt to a specific version number.
   * Actually creates a new commit that duplicates the selected historical text.
   */
  public rollbackTo(questId: string, versionNumber: number, triggeredBy: string): PromptVersion {
    const historical = this.versions.find(v => v.questId === questId && v.version === versionNumber);
    if (!historical) {
      throw new Error(`Prompt version ${versionNumber} not found for quest ${questId}`);
    }

    return this.commitVersion(
      questId,
      historical.promptText,
      triggeredBy,
      `Откат к версии #${versionNumber} (созданной ${new Date(historical.timestamp).toLocaleDateString()})`
    );
  }

  /**
   * Returns complete history of versions for a given quest.
   */
  public getHistory(questId: string): PromptVersion[] {
    return this.versions
      .filter(v => v.questId === questId)
      .sort((a, b) => a.version - b.version);
  }

  /**
   * Compares two prompt versions and returns a detailed diff representation.
   */
  public diffVersions(questId: string, versionA: number, versionB: number): {
    added: string[];
    removed: string[];
    versionA: number;
    versionB: number;
  } {
    const vA = this.versions.find(v => v.questId === questId && v.version === versionA);
    const vB = this.versions.find(v => v.questId === questId && v.version === versionB);

    if (!vA || !vB) {
      throw new Error(`Versions specified for diff comparison do not exist.`);
    }

    const wordsA = vA.promptText.split(/\s+/);
    const wordsB = vB.promptText.split(/\s+/);

    const removed = wordsA.filter(w => !wordsB.includes(w));
    const added = wordsB.filter(w => !wordsA.includes(w));

    return {
      added,
      removed,
      versionA,
      versionB
    };
  }

  /**
   * Constructs the final prompt string by integrating all game-state structures.
   */
  public buildFinalPrompt(
    npc: NPC,
    player: PlayerProfile,
    currentStepIndex: number,
    steps: any[],
    activeEvents: LiveEvent[],
    ragKnowledge: string,
    memorySummary: string,
    memoryFacts: string[]
  ): string {
    const currentStep = steps[currentStepIndex];
    const eventsSection = activeEvents.length > 0 
      ? activeEvents.map(e => `[ЭКСТРЕННОЕ LIVE СОБЫТИЕ] ${e.title}: ${e.description}`).join('\n')
      : 'Нет активных глобальных событий.';

    const factsSection = memoryFacts.length > 0
      ? memoryFacts.map(f => `• ${f}`).join('\n')
      : 'Важные факты не обнаружены.';

    return `
=== ТЕКУЩИЙ ИГРОВОЙ КОНТЕКСТ ===

--- NPC КТО ГОВОРИТ ---
Имя: ${npc.name}
Характер & Роль: ${npc.role}. Личность: ${npc.personality}

--- ХАРАКТЕРИСТИКИ ИГРОКА ---
Учетная запись: ${player.username}
Уровень силы: ${player.level}
Ранг игрока: ${player.rank}
Рюкзак/Инвентарь: ${player.inventory.join(', ') || 'Пусто'}
Достижения: ${player.achievements.join(', ') || 'Нет'}

--- ТЕКУЩИЙ ЭТАП КВЕСТА ---
Номер испытания: ${currentStepIndex + 1} из ${steps.length}
Название испытания: "${currentStep?.title || 'Нет активной задачи'}"
Описание задачи: "${currentStep?.description || 'Свободный диалог с Хранителем.'}"

--- АКТИВНЫЕ ГЛОБАЛЬНЫЕ LIVE-СОБЫТИЯ ---
${eventsSection}

--- НАЙДЕННЫЕ ЗНАНИЯ (RAG) ---
${ragKnowledge || 'Дополнительные сведения отсутствуют.'}

--- ХРОНИКА ПРЕДЫДУЩИХ СОБЫТИЙ (SUMMARY) ---
${memorySummary || 'Игрок только что начал свое путешествие.'}

--- ВАЖНЫЕ ВЫЯВЛЕННЫЕ ФАКТЫ ИЗ ПАМЯТИ ---
${factsSection}

--- ПРАВИЛА ПОВЕДЕНИЯ NPC ---
1. Общайтесь строго от лица "${npc.name}". Не раскрывайте свою ИИ-природу.
2. Не говорите кодовые слова, ответы или координаты напрямую. Направляйте таинственными подсказками.
3. Меняйте манеру общения в зависимости от Ранга игрока:
   - Если ранг "Новичок": будьте терпеливы, мягко направляйте.
   - Если ранг "Следопыт": давайте туманные подсказки, уважайте его силу.
   - Если ранг "Архивариус" / "Великий Шаман": общайтесь на равных, бросайте суровые вызовы.
4. Ответ должен быть ярким, погружающим в атмосферу, но лаконичным (до 2-3 абзацев).
`;
  }
}
