import { 
  AIConfig, 
  AIResponsePayload, 
  ChatMessageHistory, 
  MemoryFact 
} from './types.js';
import { ProviderFactory } from './providers/provider.factory.js';
import { MemoryManager } from './memory/memory.manager.js';
import { RetrievalService } from './rag/retrieval.service.js';
import { EmbeddingService } from './embeddings/embeddings.service.js';
import { PromptManager } from './prompt/prompt.manager.js';
import { ResponseParser } from './parser/response.parser.js';
import { TokenManager } from './tokenizer/token.manager.js';
import { ToolEngine, ProposedAction } from './tools/tool.engine.js';
import { ModerationService } from './moderation/moderation.service.js';
import { PlayerProfile, QuestProject, LiveEvent } from '../types/index.js';

export class AIEngineModule {
  private static instance: AIEngineModule;
  private embeddingService: EmbeddingService;
  private retrievalService: RetrievalService;
  private memoryManager: MemoryManager;
  private promptManager: PromptManager;

  private constructor() {
    this.embeddingService = new EmbeddingService();
    this.retrievalService = new RetrievalService(this.embeddingService);
    this.memoryManager = new MemoryManager();
    this.promptManager = PromptManager.getInstance();
  }

  public static getInstance(): AIEngineModule {
    if (!AIEngineModule.instance) {
      AIEngineModule.instance = new AIEngineModule();
    }
    return AIEngineModule.instance;
  }

  /**
   * Main entry point to index a project's lore in background.
   */
  public async indexProject(project: QuestProject, provider: 'gemini' | 'openai' | 'local' = 'local'): Promise<void> {
    await this.retrievalService.indexProjectKnowledge(project, provider);
  }

  /**
   * Processes a player chat interaction through the entire AI pipeline.
   * Modulates chat, RAG, memory, prompt, tokens, fallback providers, parses JSON, and validates tool executions.
   */
  public async processChat(
    project: QuestProject,
    player: PlayerProfile,
    userMessage: string,
    activeEvents: LiveEvent[] = [],
    configOverride?: Partial<AIConfig>
  ): Promise<AIResponsePayload> {
    const questId = project.id;
    const progress = player.questProgress[questId];

    if (!progress) {
      throw new Error(`Player has not joined the quest: ${questId}`);
    }

    // 1. SAFETY MODERATION CHECK
    const modResult = ModerationService.moderate(userMessage);
    if (modResult.flagged) {
      return {
        message: `[Система Безопасности]: ${modResult.reason || 'Сообщение отклонено.'}`,
        actions: [],
        rewards: [],
        levelUp: false,
        rankChanged: false,
        questCompleted: false,
        eventCompleted: false,
        inventory: player.inventory,
        notifications: ['Ваше сообщение нарушает правила тайги.']
      };
    }

    // 2. CONTEXT BUILDING & LORE SEARCH (RAG)
    const providerName = configOverride?.provider || 'deepseek';
    const ragDocs = await this.retrievalService.searchKnowledge(
      questId,
      userMessage,
      2,
      0.3,
      providerName === 'gemini' ? 'gemini' : providerName === 'openai' ? 'openai' : 'local'
    );
    const ragKnowledge = ragDocs.map(d => `[Документ Знаний] ${d.content}`).join('\n');

    // 3. RETRIEVE ACTIVE SYSTEM PROMPT
    const activePromptVersion = this.promptManager.getActiveVersion(questId);
    const systemPrompt = activePromptVersion.promptText;

    // 4. MEMORY & HISTORICAL SUMMARIES
    // Convert existing player progress history to ChatMessageHistory types
    const rawHistory: ChatMessageHistory[] = progress.chatHistory.map(h => ({
      role: h.sender === 'player' ? 'user' : h.sender === 'gamemaster' ? 'model' : 'system',
      text: h.text
    }));

    // Extract facts
    const factsStoreKey = `facts:${player.userId}:${questId}`;
    const extractedFacts = await this.memoryManager.extractLongTermFacts(rawHistory, []);
    const factStrings = extractedFacts.map(f => f.fact);

    // Dynamic historical summary if conversation gets long (> 10 items)
    let rollingSummary = '';
    if (rawHistory.length > 8) {
      rollingSummary = await this.memoryManager.compressToSummary(rawHistory, '');
    }

    // 5. ASSEMBLE FULL PROMPT
    const activeNPC = project.npcs[0] || { id: 'shaman', name: 'Байанай', role: 'Проводник', personality: 'Загадочный', avatar: '🧙‍♂️' };
    const fullAssembledPrompt = this.promptManager.buildFinalPrompt(
      activeNPC,
      player,
      progress.currentStepIndex,
      project.steps,
      activeEvents,
      ragKnowledge,
      rollingSummary,
      factStrings
    );

    // 6. TOKEN OVERFLOW OPTIMIZATION
    const activeConfig: AIConfig = {
      provider: providerName,
      model: configOverride?.model || (
        providerName === 'deepseek' ? 'deepseek-chat' :
        providerName === 'gemini' ? 'gemini-3.5-flash' : 'gpt-4o-mini'
      ),
      temperature: configOverride?.temperature ?? 0.6,
      jsonMode: true, // Quest communication enforces structured JSON payloads
      ...configOverride
    };

    const optimizationBudget = 6000; // conservative limit for safety
    const optimized = TokenManager.optimizeContext(
      fullAssembledPrompt,
      rawHistory,
      ragKnowledge,
      optimizationBudget
    );

    // 7. QUERY FAILOVER PROVIDER FACTORY
    const provider = ProviderFactory.getProvider(activeConfig.provider);
    let rawResult = '';

    try {
      rawResult = await provider.chat(
        activeConfig,
        fullAssembledPrompt,
        optimized.optimizedHistory,
        userMessage
      );
    } catch (err: any) {
      console.warn(`[AIEngine] Primary provider ${activeConfig.provider} failed: ${err.message}. Triggering automatic failover.`);
      // Automatic Failover: try 'simulation' provider as a bulletproof backup
      const backupProvider = ProviderFactory.getProvider('simulation');
      rawResult = await backupProvider.chat(
        { ...activeConfig, provider: 'simulation' as any },
        fullAssembledPrompt,
        optimized.optimizedHistory,
        userMessage
      );
    }

    // 8. RESPONSE REPAIR PARSING
    const payload = ResponseParser.parse(rawResult);

    // 9. SECURE TOOL ENGINE VALIDATION FIREWALL
    const logs: string[] = [];
    let isLevelUp = false;
    let isRankChanged = false;

    if (payload.actions && payload.actions.length > 0) {
      for (const act of payload.actions) {
        const check = ToolEngine.validateAndPrepare(act as ProposedAction, player, project);
        if (check.allowed && check.stateMutation) {
          const mutationResult = check.stateMutation(player);
          logs.push(...mutationResult.logs);
          if (mutationResult.levelUp) isLevelUp = true;
          if (mutationResult.rankChanged) isRankChanged = true;
        } else {
          console.warn(`[AIEngine Sandbox Blocked Action]: ${act.type}. Reason: ${check.reason}`);
        }
      }
    }

    // Map system action outcomes back into our returned payload
    payload.levelUp = isLevelUp;
    payload.rankChanged = isRankChanged;
    payload.inventory = player.inventory;
    payload.notifications.push(...logs);

    return payload;
  }
}
export const aiEngine = AIEngineModule.getInstance();
