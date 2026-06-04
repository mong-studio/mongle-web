# Mongle Web

Mongle Web 워크스페이스는 React/Vite 게임 화면, Godot Web 빌드, Python AI API로 구성되어 있습니다.

## 필요 환경

- Python 3.12
- uv
- Node.js 20+
- npm 10+
- Godot 프로젝트를 수정하거나 export해야 한다면 Godot 4.3

현재 Godot 관련 스크립트는 Godot 앱이 아래 경로에 있다고 가정합니다.

```bash
$HOME/Downloads/Godot.app/Contents/MacOS/Godot
```

Godot 앱이 다른 위치에 설치되어 있다면 `apps/game/package.json`의 `godot:edit`, `godot:export` 스크립트 경로를 수정해야 합니다.

## 설치

Python 3.12 기준으로 AI 패키지 환경을 설치합니다.

```bash
uv sync --project packages/ai --python 3.12 --all-extras --dev
```

React/Vite 프론트엔드 패키지를 설치합니다.

```bash
npm run web:install
```

두 명령 모두 필요합니다. `uv sync`는 Python 패키지만 설치하고, `npm run web:install`은 프론트엔드 패키지를 설치합니다.

## 실행

프론트엔드와 Python AI API를 함께 실행합니다.

```bash
npm run dev
```

브라우저에서 아래 주소를 엽니다.

```text
http://127.0.0.1:5173/
```

프론트엔드는 아래 로컬 AI API를 호출합니다.

```text
http://127.0.0.1:8010
```

프론트엔드와 API를 따로 실행할 수도 있습니다.

```bash
npm run web:dev
```

```bash
cd packages/ai
uv run python -m api.server
```

## Godot

React 앱은 export된 Godot Web 빌드를 iframe으로 불러옵니다.

```text
apps/game/public/godot/index.html
```

Godot Web 빌드를 다시 export하려면 아래 명령을 실행합니다.

```bash
npm run web:godot:export
```

Godot 에디터를 열려면 아래 명령을 실행합니다.

```bash
npm run web:godot
```

Godot은 `uv sync`나 `npm install`로 설치되지 않습니다. Godot 에디터나 export 기능이 필요한 팀원은 각자 로컬에 Godot을 설치해야 합니다.

## Lock 파일

AI 패키지의 Python 의존성은 아래 파일에 고정되어 있습니다.

```text
packages/ai/uv.lock
```

Python 의존성을 변경한 뒤에는 lock 파일을 갱신합니다.

```bash
uv lock --project packages/ai
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
npm run web:build
```

React/Vite 프론트엔드를 빌드합니다.

```bash
npm run ai:test
```

Python AI 테스트를 실행합니다.

```bash
npm run ai:demo
```

Streamlit 데모를 실행합니다.
