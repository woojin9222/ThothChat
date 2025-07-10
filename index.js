import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// In-memory storage
const storage = {
  rooms: new Map(),
  messages: new Map(),
  roomIdCounter: 1,
  messageIdCounter: 1,
  
  // Track users in each room
  roomUsers: new Map(),
  userRooms: new Map(),
  userNicknames: new Map(),
  
  init() {
    const defaultRooms = [
      "#1", "#bigdt114", "#news365", "#앱짱닷컴", "#JMR", 
      "#tpwhdsla", "#아즈텍온라인", "#ㅅㄹ", "#직업마피아", 
      "#becle", "#hh", "#main", "#totomantv"
    ];

    defaultRooms.forEach(name => {
      const room = {
        id: this.roomIdCounter++,
        name,
        userCount: Math.floor(Math.random() * 15) + 1,
        createdAt: new Date()
      };
      this.rooms.set(room.id, room);
    });
  }
};

storage.init();

// API Routes
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(storage.rooms.values())
    .sort((a, b) => b.userCount - a.userCount);
  res.json(roomList);
});

app.get('/api/rooms/:id/messages', (req, res) => {
  const roomId = parseInt(req.params.id);
  if (isNaN(roomId)) {
    return res.status(400).json({ message: "Invalid room ID" });
  }
  
  const roomMessages = Array.from(storage.messages.values())
    .filter(msg => msg.roomId === roomId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-50);
  res.json(roomMessages);
});

app.post('/api/rooms', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Room name is required' });
  }
  
  const existingRoom = Array.from(storage.rooms.values())
    .find(room => room.name === name);
  if (existingRoom) {
    return res.status(409).json({ message: 'Room already exists' });
  }
  
  const room = {
    id: storage.roomIdCounter++,
    name,
    userCount: 0,
    createdAt: new Date()
  };
  storage.rooms.set(room.id, room);
  res.status(201).json(room);
});

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'join_room':
          await handleJoinRoom(ws, message.data);
          break;
        case 'leave_room':
          await handleLeaveRoom(ws, message.data);
          break;
        case 'send_message':
          await handleSendMessage(ws, message.data);
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

async function handleJoinRoom(ws, data) {
  const { roomId, nickname } = data;
  
  const currentRoom = storage.userRooms.get(ws);
  if (currentRoom !== undefined) {
    await handleLeaveRoom(ws, { roomId: currentRoom, nickname });
  }

  if (!storage.roomUsers.has(roomId)) {
    storage.roomUsers.set(roomId, new Set());
  }
  
  storage.roomUsers.get(roomId).add(ws);
  storage.userRooms.set(ws, roomId);
  storage.userNicknames.set(ws, nickname);

  const userCount = storage.roomUsers.get(roomId).size;
  const room = storage.rooms.get(roomId);
  if (room) {
    room.userCount = userCount;
    storage.rooms.set(roomId, room);
  }

  broadcastToRoom(roomId, {
    type: 'user_count_update',
    data: { roomId, userCount }
  });

  const messages = Array.from(storage.messages.values())
    .filter(msg => msg.roomId === roomId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-50);
    
  ws.send(JSON.stringify({
    type: 'room_messages',
    data: messages
  }));
}

async function handleLeaveRoom(ws, data) {
  const { roomId } = data;
  
  const roomUsersSet = storage.roomUsers.get(roomId);
  if (roomUsersSet) {
    roomUsersSet.delete(ws);
    
    const userCount = roomUsersSet.size;
    const room = storage.rooms.get(roomId);
    if (room) {
      room.userCount = userCount;
      storage.rooms.set(roomId, room);
    }

    broadcastToRoom(roomId, {
      type: 'user_count_update',
      data: { roomId, userCount }
    });
  }
  
  storage.userRooms.delete(ws);
  storage.userNicknames.delete(ws);
}

async function handleSendMessage(ws, data) {
  const { roomId, nickname, message } = data;
  
  try {
    const savedMessage = {
      id: storage.messageIdCounter++,
      roomId,
      nickname,
      message,
      timestamp: new Date()
    };
    storage.messages.set(savedMessage.id, savedMessage);
    
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

function handleDisconnect(ws) {
  const roomId = storage.userRooms.get(ws);
  const nickname = storage.userNicknames.get(ws);
  
  if (roomId !== undefined && nickname) {
    handleLeaveRoom(ws, { roomId, nickname });
  }
}

function broadcastToRoom(roomId, message) {
  const roomUsersSet = storage.roomUsers.get(roomId);
  if (roomUsersSet) {
    const messageStr = JSON.stringify(message);
    roomUsersSet.forEach(ws => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(messageStr);
      }
    });
  }
}

// Serve static files
const possibleDistPaths = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, 'client', 'dist'),
  path.join(__dirname, 'public'),
];

let distPath = null;
for (const p of possibleDistPaths) {
  if (fs.existsSync(p)) {
    distPath = p;
    break;
  }
}

if (distPath) {
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend build not found');
    }
  });
} else {
  // Fallback HTML for when dist folder doesn't exist
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>UChat - 실시간 채팅</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: 'Noto Sans KR', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; text-align: center; margin-bottom: 20px; }
          .status { padding: 15px; background: #e3f2fd; border-radius: 5px; margin: 20px 0; }
          .api-link { display: inline-block; padding: 10px 20px; background: #2196f3; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .api-link:hover { background: #1976d2; }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
      </head>
      <body>
        <div class="container">
          <h1>🗨️ UChat - 실시간 채팅</h1>
          <div class="status">
            <strong>서버 상태:</strong> 실행 중 ✅<br>
            <strong>API 엔드포인트:</strong> 정상 작동<br>
            <strong>WebSocket:</strong> 지원됨
          </div>
          
          <p>프론트엔드 빌드 파일이 없습니다. 다음 명령어로 빌드하세요:</p>
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">npm run build</pre>
          
          <p>API 테스트:</p>
          <a href="/api/rooms" class="api-link">채팅방 목록 보기</a>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            <p>이 페이지는 배포 환경에서 프론트엔드 빌드가 없을 때 표시됩니다.</p>
          </div>
        </div>
      </body>
      </html>
    `);
  });
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;