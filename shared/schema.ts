import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  userCount: integer("user_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  nickname: text("nickname").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).pick({
  name: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  roomId: true,
  nickname: true,
  message: true,
});

export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// WebSocket message types
export interface WSMessage {
  type: 'join_room' | 'leave_room' | 'send_message' | 'room_update' | 'new_message' | 'user_count_update';
  data: any;
}

export interface JoinRoomData {
  roomId: number;
  nickname: string;
}

export interface LeaveRoomData {
  roomId: number;
  nickname: string;
}

export interface SendMessageData {
  roomId: number;
  nickname: string;
  message: string;
}

export interface NewMessageData {
  id: number;
  roomId: number;
  nickname: string;
  message: string;
  timestamp: string;
}

export interface UserCountUpdateData {
  roomId: number;
  userCount: number;
}
