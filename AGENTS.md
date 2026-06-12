# Mongle Web — Agent Guide

React/Vite + Phaser 기반 몽글마을 웹 앱. React가 HUD/모달 UI를, Phaser가 Tiled 맵 배경을 담당한다.

## Commands

```bash
npm install        # 의존성 설치
npm run dev        # 개발 서버 (http://127.0.0.1:5173)
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + vite build
npm run test       # vitest
npm run check      # biome lint + format 검사
```

## Folder Structure Rules

코드를 추가하거나 수정할 때 아래 배치 규칙을 따른다.

```text
src/
├── main.tsx          # 엔트리 (createRoot만) — 여기에 로직 추가 금지
├── app/              # 앱 셸: App.tsx, featureRegistry.ts, global.css
├── features/<도메인>/  # 도메인별 기능 (kebab-case 폴더)
│   ├── auth/  calendar/  character/  my-page/
│   ├── planner-chat/  todo/  village/
└── shared/           # 두 개 이상의 feature가 쓰는 코드만
    ├── api/          # HTTP 클라이언트 (apiClient)
    └── ui/           # 재사용 UI 컴포넌트 (Tag 등)
```

- **새 도메인 기능**은 `src/features/<kebab-case>/`에 새 폴더로 만든다. feature 내부 파일 수가 많아지면 `ui/`, `model/`, `api/`로만 나눈다.
- **이장님 대화창에 뜨는 기능창**을 추가할 때는 `src/app/featureRegistry.ts`의 `FEATURES`에 등록하고 `src/app/App.tsx`에서 모달을 연결한다.
- **feature 간 직접 import 금지.** 다른 feature의 코드가 필요하면 `src/shared/`로 승격한 뒤 양쪽에서 import한다. (현재 예외: planner-chat이 todo의 `TodoCommitResult` 타입을 import — 새로 추가하지 말 것)
- **HTTP 호출**은 `src/shared/api/client.js`의 `apiClient`를 사용한다. feature별 API 함수는 해당 feature 폴더 안에 둔다 (예: `features/todo/todoApi.ts`).
- **네이밍**: React 컴포넌트 파일은 PascalCase(`MyPage.tsx`), 훅은 `useX.ts`, 그 외 모듈은 camelCase. CSS는 컴포넌트 옆에 colocate(`MyPage.css`).
- **import 경로**는 상대 경로 + `.js` 확장자를 쓴다 (`moduleResolution: nodenext`). 예: `import { apiClient } from "../../shared/api/client.js"`.
- **정적 자산**은 `public/assets/`에 둔다. 맵 에셋은 `public/assets/map/`.
- 전역 스타일은 `src/app/global.css` 하나만 유지하고, 새 스타일은 feature CSS에 추가한다.

## Conventions

- 커밋 메시지는 conventional commits (`feat:`, `fix:`, `refactor:`, ...) — commitlint가 강제한다.
- 커밋 전 husky가 biome check를 실행한다. CI는 biome + typecheck + build를 검사한다.
- React UI는 Phaser 캔버스 위에 레이어로 올린다.
