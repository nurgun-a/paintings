import { AIResponsePayload } from '../types.js';

export class ResponseParser {
  /**
   * Parses, validates, and auto-repairs any raw text response into a strictly typed AIResponsePayload.
   */
  public static parse(raw: string): AIResponsePayload {
    const fallback: AIResponsePayload = {
      message: raw,
      actions: [],
      rewards: [],
      levelUp: false,
      rankChanged: false,
      questCompleted: false,
      eventCompleted: false,
      inventory: [],
      notifications: []
    };

    if (!raw) return fallback;

    let cleaned = raw.trim();

    // 1. Strip Markdown code blocks if present
    const mdJsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (mdJsonMatch) {
      cleaned = mdJsonMatch[1].trim();
    }

    // 2. Simple sanity check: if the response does not contain '{', it's a plain conversational response.
    // Return it immediately and cleanly without triggering warning log noise.
    if (!cleaned.includes('{')) {
      fallback.message = cleaned;
      return fallback;
    }

    // 3. Try direct JSON parsing
    try {
      const parsed = JSON.parse(cleaned);
      return this.validateAndBuildPayload(parsed);
    } catch (err) {
      // 4. Locate first '{' and last '}' to extract JSON block from conversational text wrapper
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const potentialJson = cleaned.substring(firstBrace, lastBrace + 1);
        try {
          const parsed = JSON.parse(potentialJson);
          return this.validateAndBuildPayload(parsed);
        } catch (repairErr) {
          // 5. Try deep cleanup repair on the extracted JSON block (remove comments, trailing commas, etc.)
          try {
            const repairedString = this.cleanAndRepairJSONString(potentialJson);
            const parsed = JSON.parse(repairedString);
            return this.validateAndBuildPayload(parsed);
          } catch (deepRepairErr) {
            console.warn('[ResponseParser] Failed to parse or repair JSON:', deepRepairErr);
          }
        }
      }
    }

    // Conversational fallback
    fallback.message = cleaned;
    return fallback;
  }

  /**
   * Validates and normalizes parsed JSON object into the rigid AIResponsePayload structure.
   */
  private static validateAndBuildPayload(parsed: any): AIResponsePayload {
    return {
      message: String(parsed.message || parsed.text || '').trim(),
      actions: Array.isArray(parsed.actions) ? parsed.actions.map((act: any) => ({
        type: String(act.type || ''),
        params: typeof act.params === 'object' && act.params !== null ? act.params : {}
      })) : [],
      rewards: Array.isArray(parsed.rewards) ? parsed.rewards.map((rew: any) => ({
        xp: typeof rew.xp === 'number' ? rew.xp : undefined,
        item: rew.item ? String(rew.item) : undefined,
        achievement: rew.achievement ? String(rew.achievement) : undefined
      })) : [],
      levelUp: !!parsed.levelUp,
      rankChanged: !!parsed.rankChanged,
      questCompleted: !!parsed.questCompleted,
      eventCompleted: !!parsed.eventCompleted,
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory.map(String) : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications.map(String) : []
    };
  }

  /**
   * Normalizes common minor syntax errors in LLM generated JSON strings (comments, trailing commas).
   */
  private static cleanAndRepairJSONString(jsonStr: string): string {
    let s = jsonStr.trim();
    // Strip block comments and single line comments
    s = s.replace(/\/\*[\s\S]*?\*\//g, '');
    s = s.replace(/(?:^|[^:])\/\/.*$/gm, '');
    // Strip trailing commas inside arrays and objects
    s = s.replace(/,(\s*[}\]])/g, '$1');
    return s;
  }
}

