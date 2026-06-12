# Project Structure

```text
mongle-web/
├── public/
│   └── assets/
│       ├── map/                   # Tiled map, tilesets, tile images
│       └── mongle_chief.png
├── src/
│   ├── main.tsx                   # 엔트리 (createRoot만)
│   ├── app/
│   │   ├── App.tsx                # 레이아웃 + 기능창 오케스트레이션
│   │   ├── featureRegistry.ts     # 기능창(FEATURES) 정의
│   │   └── global.css             # 전역 스타일
│   ├── features/                  # 도메인별 기능
│   │   ├── auth/                  # 로그인, 세션 스토어
│   │   ├── calendar/
│   │   ├── character/
│   │   ├── my-page/
│   │   ├── planner-chat/
│   │   ├── todo/
│   │   └── village/               # Phaser 맵 렌더러
│   └── shared/                    # 도메인 간 공유 코드
│       ├── api/                   # HTTP 클라이언트
│       └── ui/                    # 재사용 컴포넌트 (Tag 등)
├── docs/
├── legacy/
├── package.json
└── vite.config.ts
```

## 폴더 규칙

- 컴포넌트 파일은 PascalCase, 훅은 `useX.ts`, 그 외 모듈은 camelCase
- feature 간 직접 import는 피하고, 공유가 필요하면 `shared/`로 승격
- CSS는 해당 컴포넌트 옆에 colocate

## Runtime Flow

```text
src/main.tsx
  -> src/app/App.tsx (React HUD, panels, modals)
  -> src/features/village/PhaserVillage.tsx
    -> public/assets/map/mongle.tmj
    -> public/assets/map/*.tsx
    -> public/assets/map/*.png
```

## Common Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
```
