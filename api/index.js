import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// In-memory storage for demo
const rooms = new Map();
const messages = new Map();
let roomIdCounter = 1;
let messageIdCounter = 1;

// Initialize default rooms
const defaultRooms = [
  "#1", "#bigdt114", "#news365", "#앱짱닷컴", "#JMR", 
  "#tpwhdsla", "#아즈텍온라인", "#ㅅㄹ", "#직업마피아", 
  "#becle", "#hh", "#main", "#totomantv"
];

defaultRooms.forEach(name => {
  const room = {
    id: roomIdCounter++,
    name,
    userCount: Math.floor(Math.random() * 15) + 1,
    createdAt: new Date()
  };
  rooms.set(room.id, room);
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).sort((a, b) => b.userCount - a.userCount);
  res.json(roomList);
});

app.get('/api/rooms/:id/messages', (req, res) => {
  const roomId = parseInt(req.params.id);
  const roomMessages = Array.from(messages.values())
    .filter(msg => msg.roomId === roomId)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .slice(-50);
  res.json(roomMessages);
});

app.post('/api/rooms', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Room name is required' });
  }
  
  // Check if room exists
  const existingRoom = Array.from(rooms.values()).find(room => room.name === name);
  if (existingRoom) {
    return res.status(409).json({ message: 'Room already exists' });
  }
  
  const room = {
    id: roomIdCounter++,
    name,
    userCount: 0,
    createdAt: new Date()
  };
  rooms.set(room.id, room);
  res.status(201).json(room);
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

export default app;