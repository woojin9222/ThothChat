import { NextResponse } from "next/server";
import { addMessage, listMessages } from "@/lib/chat-store";

export async function GET() {
  return NextResponse.json({ messages: listMessages() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "잘못된 JSON 요청입니다." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("nickname" in body) ||
    !("content" in body)
  ) {
    return NextResponse.json(
      { message: "nickname과 content는 필수입니다." },
      { status: 400 },
    );
  }

  const rawNickname = (body as { nickname: unknown }).nickname;
  const rawContent = (body as { content: unknown }).content;
  if (typeof rawNickname !== "string" || typeof rawContent !== "string") {
    return NextResponse.json(
      { message: "nickname과 content는 문자열이어야 합니다." },
      { status: 400 },
    );
  }

  const nickname = rawNickname.trim();
  const content = rawContent.trim();

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
