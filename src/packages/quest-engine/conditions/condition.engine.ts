import { QuestCondition, QuestPlayerState } from '../types.js';
import { pluginAPI } from '../core/plugin.api.js';

export class ConditionEngine {
  /**
   * Evaluates if a single condition is met.
   */
  public static async evaluate(condition: QuestCondition, state: QuestPlayerState): Promise<boolean> {
    const { type, params } = condition;

    switch (type) {
      case 'LEVEL_GTE': {
        const requiredLevel = Number(params.level ?? 1);
        return state.level >= requiredLevel;
      }

      case 'RANK_EQUALS': {
        const expectedRank = String(params.rank ?? '').toLowerCase();
        return state.rank.toLowerCase() === expectedRank;
      }

      case 'HAS_ACHIEVEMENT': {
        const achievementId = String(params.achievementId ?? '');
        return state.achievements.some(a => a.id === achievementId);
      }

      case 'HAS_ITEM': {
        const itemId = String(params.itemId ?? '');
        const minQty = Number(params.minQuantity ?? 1);
        const item = state.inventory.find(i => i.id === itemId);
        return !!item && item.quantity >= minQty;
      }

      case 'QUEST_COMPLETED': {
        const questId = String(params.questId ?? '');
        return state.completedQuests.includes(questId);
      }

      case 'FLAG_EQUALS': {
        const flagName = String(params.flagName ?? '');
        const expectedValue = !!params.value;
        return (state.flags[flagName] ?? false) === expectedValue;
      }

      case 'VARIABLE_COMPRESSED': {
        const varName = String(params.varName ?? '');
        const op = String(params.operator ?? '=='); // '==', '!=', '>', '<', '>=', '<='
        const expected = params.value;
        const actual = state.variables[varName];

        if (actual === undefined) return false;

        switch (op) {
          case '==': return actual == expected;
          case '!=': return actual != expected;
          case '>': return Number(actual) > Number(expected);
          case '<': return Number(actual) < Number(expected);
          case '>=': return Number(actual) >= Number(expected);
          case '<=': return Number(actual) <= Number(expected);
          default: return false;
        }
      }

      case 'LOCATION_RADIUS': {
        const playerLat = Number(params.playerLat);
        const playerLng = Number(params.playerLng);
        const targetLat = Number(params.targetLat);
        const targetLng = Number(params.targetLng);
        const maxRadiusMeters = Number(params.radiusMeters ?? 50);

        if (isNaN(playerLat) || isNaN(playerLng) || isNaN(targetLat) || isNaN(targetLng)) {
          return false;
        }

        const distance = this.calculateHaversineDistance(playerLat, playerLng, targetLat, targetLng);
        return distance <= maxRadiusMeters;
      }

      case 'QR_VALID': {
        const qrInput = String(params.qrInput ?? '').trim();
        const expectedQr = String(params.expectedQr ?? '').trim();
        
        // Supports pluggable validator if registered
        if (pluginAPI.hasPlugin('QR')) {
          const plugin = pluginAPI.getPlugin('QR')!;
          const check = await plugin.validate({ qrInput }, { expectedQr });
          return check.success;
        }

        // Default: Verify straight string or basic structure (such as UUID formats)
        return qrInput === expectedQr;
      }

      case 'TEXT_MATCH': {
        const textInput = String(params.textInput ?? '');
        const answers: string[] = Array.isArray(params.answers) ? params.answers : [String(params.answer ?? '')];
        const ignoreCase = !!(params.ignoreCase ?? true);
        const ignoreSpaces = !!(params.ignoreSpaces ?? true);
        const useRegex = !!(params.useRegex ?? false);

        return answers.some(ans => {
          let cleanInput = textInput;
          let cleanAns = ans;

          if (useRegex) {
            try {
              const regex = new RegExp(ans, ignoreCase ? 'i' : '');
              return regex.test(textInput);
            } catch {
              return false;
            }
          }

          if (ignoreCase) {
            cleanInput = cleanInput.toLowerCase();
            cleanAns = cleanAns.toLowerCase();
          }

          if (ignoreSpaces) {
            cleanInput = cleanInput.replace(/\s+/g, '');
            cleanAns = cleanAns.replace(/\s+/g, '');
          }

          return cleanInput === cleanAns;
        });
      }

      default: {
        // Evaluate via custom pluggable rules if plugin matches
        const possiblePlugin = type as any;
        if (pluginAPI.hasPlugin(possiblePlugin)) {
          const plugin = pluginAPI.getPlugin(possiblePlugin)!;
          const evaluation = await plugin.validate(params.input, params);
          return evaluation.success;
        }
        return false;
      }
    }
  }

  /**
   * Evaluates multiple conditions together, supporting logical operators.
   */
  public static async evaluateBatch(
    conditions: QuestCondition[],
    state: QuestPlayerState,
    logicalOperator: 'AND' | 'OR' = 'AND'
  ): Promise<boolean> {
    if (conditions.length === 0) return true;

    const promises = conditions.map(c => this.evaluate(c, state));
    const results = await Promise.all(promises);

    if (logicalOperator === 'OR') {
      return results.some(r => r === true);
    }
    return results.every(r => r === true);
  }

  /**
   * Calculate precise geolocational distance using Haversine formula in meters.
   */
  private static calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radius of Earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in meters
  }
}
