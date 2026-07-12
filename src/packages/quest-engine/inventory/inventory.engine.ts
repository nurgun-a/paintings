import { InventoryItem, QuestPlayerState } from '../types.js';

export class InventoryEngine {
  /**
   * Safely adds a item to the player inventory, stacking if it already exists.
   * Respects maximum weight limits if provided.
   */
  public static addItem(
    state: QuestPlayerState,
    item: Omit<InventoryItem, 'quantity'>,
    quantityToAdd: number = 1,
    maxWeightCapacity?: number
  ): { success: boolean; reason?: string } {
    if (quantityToAdd <= 0) {
      return { success: false, reason: 'Invalid item quantity.' };
    }

    const currentWeight = this.calculateTotalWeight(state);
    const addedWeight = item.weight * quantityToAdd;

    if (maxWeightCapacity !== undefined && (currentWeight + addedWeight) > maxWeightCapacity) {
      return { success: false, reason: '🎒 Вес рюкзака превышает предельно допустимую грузоподъемность!' };
    }

    const existingIndex = state.inventory.findIndex(i => i.id === item.id);
    if (existingIndex !== -1) {
      state.inventory[existingIndex].quantity += quantityToAdd;
    } else {
      state.inventory.push({
        ...item,
        quantity: quantityToAdd
      });
    }

    state.updatedAt = new Date().toISOString();
    return { success: true };
  }

  /**
   * Removes or decrements an item in the player's inventory.
   */
  public static removeItem(
    state: QuestPlayerState,
    itemId: string,
    quantityToRemove: number = 1
  ): { success: boolean; reason?: string } {
    const existingIndex = state.inventory.findIndex(i => i.id === itemId);
    if (existingIndex === -1) {
      return { success: false, reason: 'Предмет отсутствует в вашем рюкзаке.' };
    }

    const item = state.inventory[existingIndex];
    if (item.quantity < quantityToRemove) {
      return { success: false, reason: 'Недостаточное количество предметов для извлечения.' };
    }

    item.quantity -= quantityToRemove;
    if (item.quantity === 0) {
      state.inventory.splice(existingIndex, 1);
    }

    state.updatedAt = new Date().toISOString();
    return { success: true };
  }

  /**
   * Counts the total weight of the inventory.
   */
  public static calculateTotalWeight(state: QuestPlayerState): number {
    return state.inventory.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  }

  /**
   * Safely checks if player carries a specific item.
   */
  public static hasItem(state: QuestPlayerState, itemId: string, minQuantity: number = 1): boolean {
    const item = state.inventory.find(i => i.id === itemId);
    return !!item && item.quantity >= minQuantity;
  }
}
