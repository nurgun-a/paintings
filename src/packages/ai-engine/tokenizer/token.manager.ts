import { ChatMessageHistory, TokenOptimizationResult } from '../types.js';

export class TokenManager {
  /**
   * Estimates token count for a text string.
   * Standard LLM tokenizers (BPE / SentencePiece) map about 4 characters to 1 token for English (Latin),
   * but for Russian (Cyrillic), because of multi-byte encodings and grammatical richness,
   * 1 Cyrillic character represents roughly 0.5 to 0.75 tokens.
   */
  public static countTokens(text: string): number {
    if (!text) return 0;
    
    let tokens = 0;
    const words = text.split(/\s+/);
    
    for (const word of words) {
      if (word.length === 0) continue;
      
      // Check if word contains Cyrillic characters
      const isCyrillic = /[\u0400-\u04FF]/.test(word);
      if (isCyrillic) {
        // Cyrillic words usually have ~1.5 tokens per word on average, or 0.6 tokens per character
        tokens += Math.ceil(word.length * 0.7);
      } else {
        // Latin words average ~1.3 tokens per word, or 0.28 tokens per character
        tokens += Math.ceil(word.length * 0.3) + 1;
      }
    }
    
    return tokens;
  }

  /**
   * Automatically counts tokens for an entire chat history.
   */
  public static countHistoryTokens(history: ChatMessageHistory[]): number {
    return history.reduce((sum, msg) => sum + this.countTokens(msg.text), 0);
  }

  /**
   * Optimizes context and history to fit within a specified max token budget.
   * If token limit is breached, it systematically:
   * 1. Shrinks retrieved knowledge contexts
   * 2. Evicts older chat histories (retaining newer ones)
   * 3. Retains system context as top priority.
   */
  public static optimizeContext(
    systemPrompt: string,
    history: ChatMessageHistory[],
    retrievedKnowledge: string,
    maxBudget: number = 8000
  ): TokenOptimizationResult {
    const sysTokens = this.countTokens(systemPrompt);
    const userPromptText = history.length > 0 ? history[history.length - 1].text : '';
    const lastPromptTokens = this.countTokens(userPromptText);

    // Reserved budget for system prompt and the active player input
    const reservedTokens = sysTokens + lastPromptTokens + 200; // adding 200 safety cushion
    
    if (reservedTokens > maxBudget) {
      console.warn(`[TokenManager] Fatal: System prompt and player message exceed total budget of ${maxBudget}! Force-truncating.`);
      // If even system + prompt exceeds budget, we must aggressively clip them
      return {
        optimizedHistory: history.slice(-1), // only keep the last message
        optimizedContext: retrievedKnowledge.slice(0, 500), // clip knowledge
        totalTokens: reservedTokens,
        limitExceeded: true
      };
    }

    let availableHistoryTokens = maxBudget - reservedTokens;
    let optimizedKnowledge = retrievedKnowledge;
    let knowledgeTokens = this.countTokens(optimizedKnowledge);

    // If still over budget, shrink retrieved knowledge first
    if (knowledgeTokens > availableHistoryTokens * 0.3) {
      const allowedKnowledgeTokens = Math.floor(availableHistoryTokens * 0.2);
      if (allowedKnowledgeTokens > 0) {
        // Truncate knowledge text roughly to match allowed tokens
        const charLimit = allowedKnowledgeTokens * 3; // ~3 chars per token average
        optimizedKnowledge = retrievedKnowledge.slice(0, charLimit) + '\n...[Контекст сокращен для экономии токенов]...';
        knowledgeTokens = this.countTokens(optimizedKnowledge);
      } else {
        optimizedKnowledge = '';
        knowledgeTokens = 0;
      }
    }

    // Now recalculate remaining budget for chat history
    availableHistoryTokens = maxBudget - sysTokens - lastPromptTokens - knowledgeTokens - 100;

    const optimizedHistory: ChatMessageHistory[] = [];
    let accumulatedHistoryTokens = 0;

    // Build optimized history backwards from the second-to-last message
    // (since last message is the active player input, handled in reservedTokens)
    const historicalMessages = history.slice(0, -1);
    
    for (let i = historicalMessages.length - 1; i >= 0; i--) {
      const msg = historicalMessages[i];
      const msgTokens = this.countTokens(msg.text);
      
      if (accumulatedHistoryTokens + msgTokens <= availableHistoryTokens) {
        optimizedHistory.unshift(msg); // Add to beginning to keep chronological order
        accumulatedHistoryTokens += msgTokens;
      } else {
        break; // Stop including older messages
      }
    }

    // Append the active player message back to the end
    if (history.length > 0) {
      optimizedHistory.push(history[history.length - 1]);
    }

    const finalTotalTokens = sysTokens + accumulatedHistoryTokens + lastPromptTokens + knowledgeTokens;
    const limitExceeded = history.length !== optimizedHistory.length;

    if (limitExceeded) {
      console.log(`[TokenManager] Optimized context: compressed ${history.length} chat history items into ${optimizedHistory.length} items. Total estimated tokens: ${finalTotalTokens}/${maxBudget}`);
    }

    return {
      optimizedHistory,
      optimizedContext: optimizedKnowledge,
      totalTokens: finalTotalTokens,
      limitExceeded
    };
  }
}
