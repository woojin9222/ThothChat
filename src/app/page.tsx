"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ChatMessage = {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
};

export default function Home() {
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const canSend = useMemo(
    () => nickname.trim().length > 0 && message.trim().length > 0 && !isSending,
    [nickname, message, isSending],
  );

  const loadMessages = async () => {
    const res = await fetch("/api/messages");
    if (!res.ok) return;
    const data = (await res.json()) as { messages: ChatMessage[] };
    setMessages(data.messages);
  };

  useEffect(() => {
    void loadMessages();
    const timer = setInterval(() => {
      void loadMessages();
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          content: message.trim(),
        }),
      });

      if (!res.ok) return;
      setMessage("");
      await loadMessages();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">ThothChat</h1>
      <p className="mb-6 text-sm text-zinc-500">Next.js 기반 실시간 느낌의 간단 채팅 서비스</p>

      <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="mb-2 block text-sm font-medium">닉네임</label>
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
          placeholder="닉네임을 입력하세요"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
        />
      </div>

      <section className="mb-4 flex-1 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">메시지</h2>
        <ul className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto">
          {messages.map((item) => (
            <li key={item.id} className="rounded-lg bg-zinc-50 p-3">
              <div className="mb-1 flex items-center gap-2 text-sm">
                <span className="font-semibold text-zinc-800">{item.nickname}</span>
                <span className="text-xs text-zinc-400">
                  {new Date(item.createdAt).toLocaleTimeString("ko-KR")}
                </span>
              </div>
              <p className="text-sm text-zinc-700">{item.content}</p>
            </li>
          ))}
          {messages.length === 0 && (
            <li className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-500">
              아직 메시지가 없습니다. 첫 메시지를 보내보세요.
            </li>
          )}
        </ul>
      </section>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
          placeholder="메시지를 입력하세요"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={300}
        />
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          전송
        </button>
      </form>
    </main>
  );
}
