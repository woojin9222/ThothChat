# UChat - 실시간 채팅 애플리케이션

uchat.ch를 모델로 한 실시간 채팅 애플리케이션입니다. 간단한 닉네임 기반 채팅 시스템으로 여러 채팅방에서 실시간으로 대화할 수 있습니다.

## 주요 기능

- 🚀 **실시간 채팅**: WebSocket을 이용한 즉석 메시지 전송
- 👥 **다중 채팅방**: 여러 채팅방 생성 및 참여 가능
- 📱 **반응형 디자인**: 데스크톱과 모바일 모두 지원
- 🏷️ **닉네임 시스템**: 간단한 닉네임으로 채팅 참여
- 👀 **실시간 인원수**: 각 채팅방의 현재 접속자 수 표시
- 💬 **uchat 스타일**: "닉네임: 메시지" 형태의 깔끔한 채팅 UI

## 기술 스택

### Frontend
- **React 18** - 모던 UI 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **shadcn/ui** - 고품질 UI 컴포넌트
- **TanStack Query** - 서버 상태 관리
- **Wouter** - 경량 라우팅
- **Vite** - 빠른 빌드 도구

### Backend
- **Node.js + Express** - 웹 서버
- **WebSocket (ws)** - 실시간 통신
- **TypeScript** - 타입 안전성
- **In-Memory Storage** - 빠른 데이터 처리

## 시작하기

### 필요 조건
- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행

1. 저장소 클론
```bash
git clone <your-repo-url>
cd uchat-clone
```

2. 의존성 설치
```bash
npm install
```

3. 개발 서버 실행
```bash
npm run dev
```

4. 브라우저에서 `http://localhost:5000` 접속

## 사용 방법

1. **닉네임 설정**: 왼쪽 사이드바에서 원하는 닉네임을 입력하세요
2. **채팅방 참여**: 채팅방 목록에서 원하는 방을 클릭하세요
3. **메시지 전송**: 하단 입력창에 메시지를 입력하고 엔터 또는 전송 버튼을 클릭하세요
4. **새 채팅방 생성**: 채팅방 목록의 + 버튼으로 새 방을 만들 수 있습니다

## 프로젝트 구조

```
├── client/                 # Frontend React 애플리케이션
│   ├── src/
│   │   ├── components/     # UI 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── hooks/         # 커스텀 훅
│   │   └── lib/           # 유틸리티 및 설정
├── server/                # Backend Express 서버
│   ├── index.ts          # 서버 진입점
│   ├── routes.ts         # API 라우트 및 WebSocket
│   ├── storage.ts        # 데이터 저장소
│   └── vite.ts           # Vite 설정
├── shared/               # 공유 타입 및 스키마
└── README.md
```

## 개발 정보

- **메시지 형식**: "닉네임: 메시지" 스타일
- **실시간 연결**: WebSocket `/ws` 엔드포인트
- **API 엔드포인트**:
  - `GET /api/rooms` - 채팅방 목록
  - `GET /api/rooms/:id/messages` - 채팅방 메시지
  - `POST /api/rooms` - 새 채팅방 생성

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 배포하기

### Vercel 배포
1. GitHub에 프로젝트 업로드 후
2. [Vercel](https://vercel.com)에서 "New Project" 클릭
3. GitHub 저장소 연결
4. 배포 설정:
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. "Deploy" 클릭

### 환경 변수 (필요시)
- `NODE_ENV=production`

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 참고

이 프로젝트는 uchat.ch의 UI/UX를 참고하여 만들어진 학습 목적의 클론 프로젝트입니다.