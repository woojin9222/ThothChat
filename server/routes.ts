import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertChatRoomSchema, insertChatMessageSchema, type WSMessage, type JoinRoomData, type LeaveRoomData, type SendMessageData } from "@shared/schema";

// Track users in each room
const roomUsers = new Map<number, Set<WebSocket>>();
const userRooms = new Map<WebSocket, number>();
const userNicknames = new Map<WebSocket, string>();

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getChatRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get("/api/rooms/:id/messages", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }
      
      const messages = await storage.getChatMessages(roomId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/rooms", async (req, res) => {
    try {
      const validatedData = insertChatRoomSchema.parse(req.body);
      
      // Check if room already exists
      const existingRoom = await storage.getChatRoomByName(validatedData.name);
      if (existingRoom) {
        return res.status(409).json({ message: "Room already exists" });
      }
      
      const room = await storage.createChatRoom(validatedData);
      res.status(201).json(room);
    } catch (error) {
      res.status(400).json({ message: "Invalid room data" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket Server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_room':
            await handleJoinRoom(ws, message.data as JoinRoomData);
            break;
          case 'leave_room':
            await handleLeaveRoom(ws, message.data as LeaveRoomData);
            break;
          case 'send_message':
            await handleSendMessage(ws, message.data as SendMessageData);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws);
    });
  });

  async function handleJoinRoom(ws: WebSocket, data: JoinRoomData) {
    const { roomId, nickname } = data;
    
    // Leave current room if any
    const currentRoom = userRooms.get(ws);
    if (currentRoom !== undefined) {
      await handleLeaveRoom(ws, { roomId: currentRoom, nickname });
    }

    // Join new room
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set());
    }
    
    roomUsers.get(roomId)!.add(ws);
    userRooms.set(ws, roomId);
    userNicknames.set(ws, nickname);

    // Update user count
    const userCount = roomUsers.get(roomId)!.size;
    await storage.updateChatRoomUserCount(roomId, userCount);

    // Broadcast user count update
    broadcastToRoom(roomId, {
      type: 'user_count_update',
      data: { roomId, userCount }
    });

    // Send room messages to new user
    const messages = await storage.getChatMessages(roomId);
    ws.send(JSON.stringify({
      type: 'room_messages',
      data: messages
    }));
  }

  async function handleLeaveRoom(ws: WebSocket, data: LeaveRoomData) {
    const { roomId } = data;
    
    const roomUsersSet = roomUsers.get(roomId);
    if (roomUsersSet) {
      roomUsersSet.delete(ws);
      
      // Update user count
      const userCount = roomUsersSet.size;
      await storage.updateChatRoomUserCount(roomId, userCount);

      // Broadcast user count update
      broadcastToRoom(roomId, {
        type: 'user_count_update',
        data: { roomId, userCount }
      });
    }
    
    userRooms.delete(ws);
    userNicknames.delete(ws);
  }

  async function handleSendMessage(ws: WebSocket, data: SendMessageData) {
    const { roomId, nickname, message } = data;
    
    try {
      const validatedData = insertChatMessageSchema.parse(data);
      const savedMessage = await storage.createChatMessage(validatedData);
      
      // Broadcast message to all users in the room
      broadcastToRoom(roomId, {
        type: 'new_message',
        data: {
          id: savedMessage.id,
          roomId: savedMessage.roomId,
          nickname: savedMessage.nickname,
          message: savedMessage.message,
          timestamp: savedMessage.timestamp.toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }

  function handleDisconnect(ws: WebSocket) {
    const roomId = userRooms.get(ws);
    const nickname = userNicknames.get(ws);
    
    if (roomId !== undefined && nickname) {
      handleLeaveRoom(ws, { roomId, nickname });
    }
  }

  function broadcastToRoom(roomId: number, message: WSMessage) {
    const roomUsersSet = roomUsers.get(roomId);
    if (roomUsersSet) {
      const messageStr = JSON.stringify(message);
      roomUsersSet.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }

  return httpServer;
}
