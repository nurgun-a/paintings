import { AIModerationResult } from '../types.js';

export class ModerationService {
  private static blacklistWords = [
    'fuck', 'shit', 'bitch', 'asshole', 'хуй', 'пизда', 'ебать', 'сука', 'гондон', 'мудак'
  ];

  /**
   * Performs quick lexical and structural safety moderation on strings.
   * Scans for banned words, cheating injection patterns (e.g., trying to trigger prompt injections),
   * and high-threat commands.
   */
  public static moderate(text: string): AIModerationResult {
    const cleanText = text.toLowerCase().trim();
    
    const categories = {
      profanity: false,
      injection: false,
      vulgarity: false
    };

    // 1. Scan for profanity
    const containsProfanity = this.blacklistWords.some(word => cleanText.includes(word));
    if (containsProfanity) {
      categories.profanity = true;
      categories.vulgarity = true;
    }

    // 2. Scan for prompt injection attempts (e.g. "ignore previous instructions", "system override")
    const isPromptInjection = 
      cleanText.includes('ignore previous') || 
      cleanText.includes('system override') || 
      cleanText.includes('забудь предыдущие') || 
      cleanText.includes('игнорируй правила') ||
      cleanText.includes('developer mode') ||
      cleanText.includes('override role');

    if (isPromptInjection) {
      categories.injection = true;
    }

    const flagged = categories.profanity || categories.injection || categories.vulgarity;

    return {
      flagged,
      reason: flagged 
        ? categories.profanity 
          ? 'Обнаружена нецензурная лексика или оскорбления.' 
          : 'Выявлена попытка модификации системных инструкций (Prompt Injection).'
        : undefined,
      categories
    };
  }
}
