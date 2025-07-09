import { chatRooms, chatMessages, type ChatRoom, type InsertChatRoom, type ChatMessage, type InsertChatMessage } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private rooms: Map<number, ChatRoom>;
  private messages: Map<number, ChatMessage>;
  private currentRoomId: number;
  private currentMessageId: number;

  constructor() {
    this.rooms = new Map();
    this.messages = new Map();
    this.currentRoomId = 1;
    this.currentMessageId = 1;
    
    // Create default rooms
    this.initializeDefaultRooms();
  }

  private async initializeDefaultRooms() {
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

  async getChatRooms(): Promise<ChatRoom[]> {
    return Array.from(this.rooms.values()).sort((a, b) => b.userCount - a.userCount);
  }

  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    return this.rooms.get(id);
  }

  async getChatRoomByName(name: string): Promise<ChatRoom | undefined> {
    return Array.from(this.rooms.values()).find(room => room.name === name);
  }

  async createChatRoom(insertRoom: InsertChatRoom): Promise<ChatRoom> {
    const id = this.currentRoomId++;
    const room: ChatRoom = {
      ...insertRoom,
      id,
      userCount: 0,
      createdAt: new Date(),
    };
    this.rooms.set(id, room);
    return room;
  }

  async updateChatRoomUserCount(id: number, userCount: number): Promise<ChatRoom | undefined> {
    const room = this.rooms.get(id);
    if (room) {
      room.userCount = userCount;
      this.rooms.set(id, room);
      return room;
    }
    return undefined;
  }

  async getChatMessages(roomId: number, limit: number = 50): Promise<ChatMessage[]> {
    return Array.from(this.messages.values())
      .filter(message => message.roomId === roomId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-limit);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
