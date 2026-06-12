# Mongle Village Web MVP

React/Vite 기반의 몽글마을 웹 화면입니다. 메인 마을 배경은 Phaser가 Tiled JSON 맵(`public/assets/map/mongle.tmj`)을 렌더링하고, React는 HUD, 퀘스트, 주민, 로그인, 캘린더, 모달 UI를 담당합니다.

## 문서 안내

| 순서 | 문서 | 내용 |
| --- | --- | --- |
| 1 | [docs/setup-guide.md](docs/setup-guide.md) | 설치, 실행, 빌드 |
| 2 | [docs/project-guide.md](docs/project-guide.md) | 프로젝트 구조와 작업 위치 |
| 3 | [../../docs/code-quality-guide.md](../../docs/code-quality-guide.md) | Biome, Git 훅, CI |
| 4 | [docs/git-strategy.md](docs/git-strategy.md) | 브랜치, 커밋, PR |

## Quick Start

```bash
npm install
npm run dev
```

워크스페이스 루트에서는 아래 명령을 사용합니다.

```bash
npm run web:install
npm run web:dev
```

## Environment

- `VITE_API_BASE`: Django API base URL. 비어 있으면 same-origin을 사용합니다.

## What Is Implemented

- React/Vite 앱 셸
- Phaser 기반 Tiled 맵 렌더링
- 픽셀 스타일 HUD와 모달
- 포커스 타이머
- TODO/퀘스트 UI
- 주민 생성 UI
- 외부 AI TODO API 연동과 로컬 fallback

## Project Structure

```text
.
├── public/
│   └── assets/
│       ├── map/
│       │   ├── mongle.tmj
│       │   ├── *.tsx
│       │   └── *.png
│       └── mongle_chief.png
├── src/
│   ├── PhaserVillage.tsx
│   ├── main.tsx
│   ├── calendar/
│   ├── auth/
│   └── components/
├── docs/
├── legacy/
└── ASSET_CREDITS.md
```

## Known Limitations

- 맵의 일부 타일셋 파일이 없으면 해당 타일은 렌더링되지 않습니다.
- 현재 마을 캐릭터 클릭 지점은 임시 마커입니다.
- 플레이어 이동, 충돌, 오디오, 멀티플레이는 아직 없습니다.
