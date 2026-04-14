export type ChatMessage = {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
};

const MAX_MESSAGES = 100;
const globalForChat = globalThis as typeof globalThis & {
  thothChatMessages?: ChatMessage[];
};

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    nickname: "system",
    content: "ThothChat에 오신 것을 환영합니다.",
    createdAt: new Date().toISOString(),
  },
];

const messages = globalForChat.thothChatMessages ?? initialMessages;
globalForChat.thothChatMessages = messages;

export function listMessages() {
  return messages;
}

export function addMessage(input: { nickname: string; content: string }) {
  messages.push({
    id: crypto.randomUUID(),
    nickname: input.nickname,
    content: input.content,
    createdAt: new Date().toISOString(),
  });

  if (messages.length > MAX_MESSAGES) {
    messages.splice(0, messages.length - MAX_MESSAGES);
  }
}
