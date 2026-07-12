export class RoomManager {
  private static instance: RoomManager;

  // Map of RoomID -> Set of UserIDs
  private rooms: Map<string, Set<string>> = new Map();
  // Map of UserID -> Set of RoomIDs
  private userRooms: Map<string, Set<string>> = new Map();

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  /**
   * Joins a user to a specific room category.
   * e.g. joinRoom('player-123', 'project-ichchi')
   */
  public joinRoom(userId: string, roomId: string): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(userId);

    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(roomId);

    console.log(`[Room Manager] User "${userId}" joined room: "${roomId}"`);
  }

  /**
   * Leaves a specific room.
   */
  public leaveRoom(userId: string, roomId: string): void {
    const roomSet = this.rooms.get(roomId);
    if (roomSet) {
      roomSet.delete(userId);
      if (roomSet.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    const userSet = this.userRooms.get(userId);
    if (userSet) {
      userSet.delete(roomId);
      if (userSet.size === 0) {
        this.userRooms.delete(userId);
      }
    }

    console.log(`[Room Manager] User "${userId}" left room: "${roomId}"`);
  }

  /**
   * Remove user from all joined rooms.
   */
  public leaveAllRooms(userId: string): void {
    const joined = this.userRooms.get(userId);
    if (joined) {
      for (const roomId of joined) {
        const roomSet = this.rooms.get(roomId);
        if (roomSet) {
          roomSet.delete(userId);
          if (roomSet.size === 0) {
            this.rooms.delete(roomId);
          }
        }
      }
      this.userRooms.delete(userId);
    }
    console.log(`[Room Manager] Cleaned up all room memberships for user "${userId}"`);
  }

  /**
   * Get list of users currently present in a room.
   */
  public getRoomMembers(roomId: string): string[] {
    const members = this.rooms.get(roomId);
    return members ? Array.from(members) : [];
  }

  /**
   * Get list of rooms a specific user is currently participating in.
   */
  public getUserRooms(userId: string): string[] {
    const joined = this.userRooms.get(userId);
    return joined ? Array.from(joined) : [];
  }
}

export const roomManager = RoomManager.getInstance();
