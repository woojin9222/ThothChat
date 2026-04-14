import { NextResponse } from "next/server";
import { addMessage, listMessages } from "@/lib/chat-store";

export async function GET() {
  return NextResponse.json({ messages: listMessages() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<{
    nickname: string;
    content: string;
  }>;

  const nickname = body.nickname?.trim() ?? "";
  const content = body.content?.trim() ?? "";

  if (!nickname || !content) {
    return NextResponse.json(
      { message: "nickname과 content는 필수입니다." },
      { status: 400 },
    );
  }

  if (nickname.length > 20 || content.length > 300) {
    return NextResponse.json(
      { message: "닉네임/메시지 길이를 확인해주세요." },
      { status: 400 },
    );
  }

  addMessage({ nickname, content });
  return NextResponse.json({ ok: true }, { status: 201 });
}
