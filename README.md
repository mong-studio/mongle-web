# Mongle Web

Mongle Web 워크스페이스는 React/Vite 게임 화면, Phaser 타일맵 렌더링, Python AI API로 구성되어 있습니다.

## 필요 환경

- Python 3.12
- uv
- Node.js 20+
- npm 10+

## 설치

Python 3.12 기준으로 AI 패키지 환경을 설치합니다.

```bash
uv sync --project packages/ai --python 3.12 --all-extras --dev
```

React/Vite 프론트엔드 패키지를 설치합니다.

```bash
npm run web:install
```

## 실행

프론트엔드를 실행합니다.

```bash
npm run web:dev
```

브라우저에서 아래 주소를 엽니다.

```text
http://127.0.0.1:5173/
```

프론트엔드는 기본적으로 같은 origin의 API를 호출합니다. 별도 API 서버를 사용할 때는 `VITE_API_BASE`를 설정합니다.

## Phaser Map

마을 배경은 Phaser가 Tiled 맵을 렌더링합니다.

```text
apps/game/public/assets/map/mongle.tmj
apps/game/public/assets/map/*.tsx
apps/game/public/assets/map/*.png
```

맵을 수정할 때는 `mongle.tmj`의 `tilesets[].source`와 각 `.tsx`의 `<image source="...">`가 실제 파일명과 맞는지 확인합니다.

## Lock 파일

AI 패키지의 Python 의존성은 아래 파일에 고정되어 있습니다.

```text
packages/ai/uv.lock
```

프론트엔드 의존성은 아래 파일에 고정되어 있습니다.

```text
apps/game/package-lock.json
```

프론트엔드 의존성을 변경한 뒤에는 아래 명령을 실행합니다.

```bash
npm install --prefix apps/game
```

## 자주 쓰는 명령

```bash
npm run web:typecheck
npm run web:build
```
