import { chatRooms, chatMessages, type ChatRoom, type InsertChatRoom, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Chat Rooms
  getChatRooms(): Promise<ChatRoom[]>;
  getChatRoom(id: number): Promise<ChatRoom | undefined>;
  getChatRoomByName(name: string): Promise<ChatRoom | undefined>;
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  updateChatRoomUserCount(id: number, userCount: number): Promise<ChatRoom | undefined>;
  
  // Chat Messages
  getChatMessages(roomId: number, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize default rooms if they don't exist
    this.initializeDefaultRooms();
  }

  private async initializeDefaultRooms() {
    try {
      // Check if any rooms exist
      const existingRooms = await db.select().from(chatRooms).limit(1);
      
      if (existingRooms.length === 0) {
        const defaultRooms = [
          { name: "#1" },
          { name: "#bigdt114" },
          { name: "#news365" },
          { name: "#앱짱닷컴" },
          { name: "#JMR" },
          { name: "#tpwhdsla" },
          { name: "#아즈텍온라인" },
          { name: "#ㅅㄹ" },
          { name: "#직업마피아" },
          { name: "#becle" },
          { name: "#hh" },
          { name: "#main" },
          { name: "#totomantv" }
        ];

        for (const roomData of defaultRooms) {
          await this.createChatRoom(roomData);
        }
      }
    } catch (error) {
      console.error('Failed to initialize default rooms:', error);
    }
  }

  async getChatRooms(): Promise<ChatRoom[]> {
    const rooms = await db.select().from(chatRooms);
    return rooms.sort((a, b) => b.userCount - a.userCount);
  }

  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
    return room || undefined;
  }

  async getChatRoomByName(name: string): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.name, name));
    return room || undefined;
  }

  async createChatRoom(insertRoom: InsertChatRoom): Promise<ChatRoom> {
    const [room] = await db
      .insert(chatRooms)
      .values(insertRoom)
      .returning();
    return room;
  }

  async updateChatRoomUserCount(id: number, userCount: number): Promise<ChatRoom | undefined> {
    const [room] = await db
      .update(chatRooms)
      .set({ userCount })
      .where(eq(chatRooms.id, id))
      .returning();
    return room || undefined;
  }

  async getChatMessages(roomId: number, limit: number = 50): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
    
    return messages.reverse(); // Return in chronological order
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }
}

export const storage = new DatabaseStorage();
