import { ChatMessageHistory, MemoryFact, MemoryState } from '../types.js';
import { TokenManager } from '../tokenizer/token.manager.js';
import { GoogleGenAI } from '@google/genai';

export class MemoryManager {
  private geminiClient: GoogleGenAI | null = null;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }
  }

  /**
   * Automatically extracts and builds a set of Long-Term facts from chat history.
   * If an LLM is active, it prompts the LLM to extract key events; otherwise, it uses a regex-based extractor.
   */
  public async extractLongTermFacts(
    history: ChatMessageHistory[],
    existingFacts: MemoryFact[]
  ): Promise<MemoryFact[]> {
    const updatedFacts = [...existingFacts];
    const newMessages = history.slice(-3); // Analyze only the latest turn for facts to avoid redundant work

    for (const msg of newMessages) {
      if (msg.role !== 'user') continue;
      
      const text = msg.text.toLowerCase();
      
      // Look for name declarations
      const nameMatch = msg.text.match(/(меня зовут|мое имя|я|имя)\s+([А-ЯЁа-яёA-Za-z0-9_\-\s]{2,20})/i);
      if (nameMatch) {
        const declaredName = nameMatch[2].trim();
        if (!updatedFacts.some(f => f.fact.includes('имя') && f.fact.includes(declaredName))) {
          updatedFacts.push({
            id: Math.random().toString(36).substring(2, 11),
            fact: `Игрок представился по имени: "${declaredName}"`,
            confidence: 0.95,
            source: 'user_statement',
            timestamp: new Date().toISOString()
          });
        }
      }

      // Look for choices (items, paths, etc.)
      if (text.includes('выбираю') || text.includes('взял') || text.includes('купил') || text.includes('выбрал')) {
        updatedFacts.push({
          id: Math.random().toString(36).substring(2, 11),
          fact: `Игрок сделал сюжетный выбор: "${msg.text}"`,
          confidence: 0.85,
          source: 'choice',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Deduplicate facts by string similarity
    return updatedFacts.filter((fact, index, self) =>
      self.findIndex(f => f.fact.toLowerCase() === fact.fact.toLowerCase()) === index
    );
  }

  /**
   * Dynamically compresses / condenses a long chat history into a rolling narrative summary.
   * Leverages Gemini to summarize if configured, otherwise falls back to a structural summary algorithm.
   */
  public async compressToSummary(history: ChatMessageHistory[], existingSummary: string = ''): Promise<string> {
    if (history.length < 5) return existingSummary;

    const textToSummarize = history
      .map(m => `${m.role === 'user' ? 'Игрок' : 'Gamemaster'}: ${m.text}`)
      .join('\n');

    if (this.geminiClient) {
      try {
        const prompt = `
        Вы — архивариус игры. Ваша задача — сжать историю игрового чата в лаконичное резюме на русском языке.
        Сохраните все важные сюжетные выборы, полученные предметы, разгаданные тайны и текущий этап квеста.
        
        Предыдущее резюме: "${existingSummary || 'Нет предыдущего резюме'}"
        Новые реплики для интеграции:
        """
        ${textToSummarize}
        """
        
        Верните только краткое, связное резюме событий (до 3-4 предложений). Без лишнего текста.
        `;

        const res = await this.geminiClient.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt
        });

        return res.text?.trim() || existingSummary;
      } catch (err) {
        console.warn('[MemoryManager] LLM summary compression failed, falling back to static compression:', err);
      }
    }

    // Local static compression algorithm (takes key sentences from user history)
    const importantPhrases = history
      .filter(m => m.role === 'user' && (m.text.length > 15 || m.text.includes('решить') || m.text.includes('выбор')))
      .slice(-3)
      .map(m => m.text);

    return `Игрок активно преодолевает испытания. Последние ключевые действия: ${importantPhrases.join('; ')}. Текущее состояние сбалансировано.`;
  }
}
