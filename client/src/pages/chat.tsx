import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, X, Plus } from "lucide-react";
import type { ChatRoom, ChatMessage, WSMessage, JoinRoomData, SendMessageData, NewMessageData, UserCountUpdateData } from "@shared/schema";

export default function Chat() {
  const [nickname, setNickname] = useState(() => localStorage.getItem('chat-nickname') || '');
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomUserCounts, setRoomUserCounts] = useState<Map<number, number>>(new Map());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch rooms
  const { data: rooms = [], refetch: refetchRooms } = useQuery({
    queryKey: ['/api/rooms'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      setIsConnected(true);
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'new_message':
            const newMessage = message.data as NewMessageData;
            setMessages(prev => [...prev, {
              id: newMessage.id,
              roomId: newMessage.roomId,
              nickname: newMessage.nickname,
              message: newMessage.message,
              timestamp: new Date(newMessage.timestamp)
            }]);
            break;
          case 'user_count_update':
            const updateData = message.data as UserCountUpdateData;
            setRoomUserCounts(prev => new Map(prev.set(updateData.roomId, updateData.userCount)));
            break;
          case 'room_messages':
            setMessages(message.data as ChatMessage[]);
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    websocket.onclose = () => {
      setIsConnected(false);
      setWs(null);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        variant: "destructive",
        title: "연결 오류",
        description: "채팅 서버에 연결할 수 없습니다.",
      });
    };

    return () => {
      websocket.close();
    };
  }, [toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save nickname to localStorage
  useEffect(() => {
    if (nickname) {
      localStorage.setItem('chat-nickname', nickname);
    }
  }, [nickname]);

  const joinRoom = (roomId: number) => {
    if (!ws || !nickname.trim()) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "닉네임을 입력해주세요.",
      });
      return;
    }

    const joinData: JoinRoomData = {
      roomId,
      nickname: nickname.trim()
    };

    ws.send(JSON.stringify({
      type: 'join_room',
      data: joinData
    }));

    setCurrentRoomId(roomId);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const leaveRoom = () => {
    if (!ws || currentRoomId === null) return;

    ws.send(JSON.stringify({
      type: 'leave_room',
      data: { roomId: currentRoomId, nickname }
    }));

    setCurrentRoomId(null);
    setMessages([]);
  };

  const sendMessage = () => {
    if (!ws || !messageInput.trim() || currentRoomId === null || !nickname.trim()) {
      return;
    }

    const messageData: SendMessageData = {
      roomId: currentRoomId,
      nickname: nickname.trim(),
      message: messageInput.trim()
    };

    ws.send(JSON.stringify({
      type: 'send_message',
      data: messageData
    }));

    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "채팅방 이름을 입력해주세요.",
      });
      return;
    }

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newRoomName.trim() }),
      });

      if (response.ok) {
        setNewRoomName('');
        setShowCreateRoom(false);
        refetchRooms();
        toast({
          title: "성공",
          description: "새 채팅방이 생성되었습니다.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "오류",
          description: error.message || "채팅방 생성에 실패했습니다.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "채팅방 생성에 실패했습니다.",
      });
    }
  };

  const currentRoom = rooms.find(room => room.id === currentRoomId);
  const currentUserCount = currentRoomId ? roomUserCounts.get(currentRoomId) || 0 : 0;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Sidebar */}
      <div className={`w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col ${
        isSidebarOpen ? 'block' : 'hidden lg:flex'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">UChat</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">실시간 채팅방</p>
        </div>

        {/* Nickname Section */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">닉네임</Label>
            <Input
              type="text"
              placeholder="닉네임을 입력하세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-600">채팅방 목록</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateRoom(!showCreateRoom)}
                className="p-1 h-6 w-6"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Create Room Form */}
            {showCreateRoom && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
                <Input
                  type="text"
                  placeholder="채팅방 이름 (예: #새방)"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createRoom()}
                  className="text-sm"
                />
                <div className="flex space-x-2">
                  <Button onClick={createRoom} size="sm" className="flex-1">
                    생성
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateRoom(false)}
                    className="flex-1"
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              {rooms.map((room) => {
                const userCount = roomUserCounts.get(room.id) || room.userCount;
                const isActive = currentRoomId === room.id;
                
                return (
                  <div
                    key={room.id}
                    onClick={() => joinRoom(room.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{room.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full text-white ${
                        isActive ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
                        {userCount}명
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Create Room Button (Legacy) */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? '연결됨' : '연결 끊어짐'}</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-semibold text-gray-900">{currentRoom.name}</h2>
                  <span className="text-sm text-gray-500">{currentUserCount}명 접속중</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="lg:hidden"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={leaveRoom}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="text-sm">
                  <span className="font-medium text-gray-900">{message.nickname}</span>
                  <span className="text-gray-600">: </span>
                  <span className="text-gray-800">{message.message}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {message.timestamp.toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-3">
                <Input
                  type="text"
                  placeholder="메시지를 입력하세요..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-3"
                  disabled={!isConnected || !nickname.trim()}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!isConnected || !nickname.trim() || !messageInput.trim()}
                  className="px-6 py-3"
                >
                  전송
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">채팅방에 참여하세요</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    왼쪽에서 채팅방을 선택하고 실시간 대화를 시작하세요.
                  </p>
                  {!nickname.trim() && (
                    <p className="text-sm text-red-600">
                      먼저 닉네임을 설정해주세요.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4">
        <Button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="rounded-full p-3 shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
