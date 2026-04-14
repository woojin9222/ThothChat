# ThothChat

Next.js(App Router) 기반의 간단한 채팅 서비스입니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 닉네임을 입력하고 메시지를 전송할 수 있습니다.

## 주요 구성

- `src/app/page.tsx`: 채팅 UI
- `src/app/api/messages/route.ts`: 메시지 조회/등록 API
- `src/lib/chat-store.ts`: 서버 메모리 기반 메시지 저장소

## 검증 명령어

```bash
npm run lint
npm run build
```
