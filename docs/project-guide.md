# 프로젝트 가이드 (프론트엔드)

이 문서는 `mongle-web`의 구조와 코드를 어디에 둘지 설명합니다.

- 설치와 실행 방법: [setup-guide.md](setup-guide.md)
- Git·커밋·PR 방법: [git-strategy.md](git-strategy.md)
- 코드 품질·린트·커밋 검사: [../../../docs/code-quality-guide.md](../../../docs/code-quality-guide.md)
- 작업 공간 전체 구조: [../../../docs/PROJECT_STRUCTURE.md](../../../docs/PROJECT_STRUCTURE.md)

## 큰 그림

```text
mongle-web/
├── apps/
│   └── game/        # React + Vite + Phaser 화면
├── docs/
└── package.json
```

AI 기능은 별도 서비스가 제공하며, 화면은 HTTP로 API를 호출합니다. API가 꺼져 있어도 일부 기능은 로컬 fallback으로 동작합니다.

## 기본 원칙

- 화면 코드는 저장소 루트의 `src/` 안에서 작업합니다.
- 마을 배경은 `src/PhaserVillage.tsx`가 `public/assets/map/mongle.tmj`를 읽어 렌더링합니다.
- 공통 명령어는 루트 `package.json`에 모여 있습니다.
- `legacy/`의 파일은 참고용입니다. 실제 앱 코드에서 import하지 않습니다.
- 구조·실행 방법·동작이 바뀌면 문서도 같이 업데이트합니다.

## 주요 경로

| 경로 | 역할 |
| --- | --- |
| `src/main.tsx` | React 진입점, HUD, 모달, 상태, API 호출 |
| `src/PhaserVillage.tsx` | Phaser 맵 렌더러 |
| `src/style.css` | 전체 화면과 픽셀 UI 스타일 |
| `src/vite-env.d.ts` | `VITE_` 환경 변수 타입 선언 |
| `public/assets/map/` | Tiled 맵, tileset `.tsx`, 타일 이미지 |
| `public/assets/mongle_chief.png` | 기본 주민/이장 이미지 |
| `docs/` | 프로젝트 문서 |

## 연결 구조

```text
React UI
  -> PhaserVillage
    -> /assets/map/mongle.tmj
    -> /assets/map/*.tsx
    -> /assets/map/*.png
  -> fetch VITE_API_BASE/api/v1/*
```

## 코드를 어디에 둘까요?

| 상황 | 위치 |
| --- | --- |
| React 화면 UI·상태·이벤트 | `src/` |
| Phaser 맵 렌더링 | `src/PhaserVillage.tsx` |
| 맵/타일셋/타일 이미지 | `public/assets/map/` |
| 화면 스타일 | `src/style.css` |
| 새 환경 변수 추가 | `.env.example` + `src/vite-env.d.ts` |
| 작업 공간 공통 명령어 | 루트 `package.json` scripts |
| 팀원이 읽어야 할 문서 | `docs/` 또는 `docs/` |

## 개발할 때 확인할 것

- 맵 파일을 바꾸면 `mongle.tmj`의 tileset source와 실제 파일명이 맞는지 확인합니다.
- 환경 변수를 추가했다면 `.env.example`과 `vite-env.d.ts`를 함께 업데이트합니다.
- 화면 동작이 바뀌면 [QA_HARNESS.md](QA_HARNESS.md)의 수동 점검 항목을 확인합니다.
- 커밋 전 `npm run check:fix`, 푸시 전 `npm run ci-check`로 검증합니다.
