# Mongle Web

React/Vite 기반의 몽글마을 웹 화면입니다. 메인 마을 배경은 Phaser가 Tiled JSON 맵(`public/assets/map/mongle.tmj`)을 렌더링하고, React는 HUD, 퀘스트, 주민, 로그인, 캘린더, 모달 UI를 담당합니다.

## 문서 안내

| 순서 | 문서 | 내용 |
| --- | --- | --- |
| 1 | [docs/setup-guide.md](docs/setup-guide.md) | 설치, 실행, 빌드 |
| 2 | [docs/project-guide.md](docs/project-guide.md) | 프로젝트 구조와 작업 위치 |
| 3 | [docs/code-quality-guide.md](docs/code-quality-guide.md) | Biome, Git 훅, CI |
| 4 | [docs/git-strategy.md](docs/git-strategy.md) | 브랜치, 커밋, PR |

## 필요 환경

- Node.js 20+
- npm 10+

## Quick Start

```bash
npm install
npm run dev
```

브라우저에서 아래 주소를 엽니다.

```text
http://127.0.0.1:5173/
```

## 자주 쓰는 명령

```bash
npm run typecheck
npm run build
npm run test
npm run check
```

## Environment

- `VITE_API_BASE`: AI API base URL. 비어 있으면 same-origin을 사용합니다. 개발 서버는 `/api` 요청을 `http://127.0.0.1:8000`으로 프록시합니다.

## Phaser Map

마을 배경은 Phaser가 Tiled 맵을 렌더링합니다.

```text
public/assets/map/mongle.tmj
public/assets/map/*.tsx
public/assets/map/*.png
```

맵을 수정할 때는 `mongle.tmj`의 `tilesets[].source`와 각 `.tsx`의 `<image source="...">`가 실제 파일명과 맞는지 확인합니다.

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
├── src/
├── docs/
├── legacy/
└── ASSET_CREDITS.md
```

## Known Limitations

- 맵의 일부 타일셋 파일이 없으면 해당 타일은 렌더링되지 않습니다.
- 현재 마을 캐릭터 클릭 지점은 임시 마커입니다.
- 플레이어 이동, 충돌, 오디오, 멀티플레이는 아직 없습니다.
