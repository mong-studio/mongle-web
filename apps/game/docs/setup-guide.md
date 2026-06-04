# 세팅 가이드 (프론트엔드)

이 문서는 mongle-web 프론트엔드를 처음 받는 팀원이 **설치 → 실행 → 빌드**까지
막힘없이 따라 할 수 있도록 돕습니다. 개발이 처음이어도 순서대로 따라 하면 됩니다.

- 프로젝트 구조와 개발 원칙: [project-guide.md](project-guide.md)
- Git과 PR 방법: [git-strategy.md](git-strategy.md)
- 코드 품질·린트·커밋 검사: [../../../docs/code-quality-guide.md](../../../docs/code-quality-guide.md)

## 이 프로젝트는 무엇인가요?

`mongle-web`은 **프론트엔드** 작업 공간(workspace)입니다.

- **`apps/game`** — 화면을 담당하는 **React + Vite** 앱. Godot로 만든 마을 화면을
  iframe으로 띄웁니다. (여러분이 주로 작업하는 곳)

할 일(TODO) 정리 같은 **AI 기능은 별도의 `mongle-ai` 서비스**가 담당합니다.
이 저장소에서 실행하지 않고, 화면이 HTTP로 그 API를 호출할 뿐입니다.
이 문서는 화면(프론트엔드) 실행에 집중합니다.

## 미리 준비할 것

| 도구 | 권장 버전 | 확인 명령어 | 용도 |
| --- | --- | --- | --- |
| Node.js | 20 이상 | `node -v` | React/Vite 앱 실행·빌드 |
| npm | 10 이상 | `npm -v` | 패키지 설치, 명령어 실행 |
| Godot | 4.x | — | 마을 화면 편집·내보내기(선택) |

> 참고: CI(GitHub Actions)는 Node 24로 검사합니다. 로컬은 20 이상이면 충분합니다.
> Node가 없다면 [nodejs.org](https://nodejs.org/)에서 LTS 버전을 설치하세요.

## 처음 한 번만: 설치

프로젝트를 처음 받았다면 **작업 공간 루트**(`mongle-web/`)에서 아래를 실행합니다.

```bash
npm install
```

이 한 줄이 두 가지를 해 줍니다.

1. 코드 품질 도구(Biome 등)를 설치합니다.
2. Git 훅(커밋·푸시 전 자동 검사)을 자동으로 연결합니다.

훅이 잘 연결됐는지 확인하려면:

```bash
ls .husky
```

`pre-commit`, `commit-msg`, `pre-push` 파일이 보이면 정상입니다.

이어서 화면 앱(`apps/game`)의 의존성도 설치합니다.

```bash
npm run web:install
```

## 화면(프론트엔드) 실행하기

작업 공간 루트에서 아래를 실행하면 React 개발 서버가 켜집니다.

```bash
npm run web:dev
```

브라우저에서 아래 주소를 엽니다.

```text
http://127.0.0.1:5173/
```

마을 화면(Godot)이 iframe 안에 보이면 성공입니다. 코드를 저장하면 화면이
자동으로 새로고침됩니다(핫 리로드).

> 마을 화면이 비어 있다면 아직 Godot 화면을 내보내지(export) 않은 것입니다.
> 아래 "Godot 화면 내보내기"를 먼저 한 번 실행하세요.

## AI 기능 사용하기

할 일 입력창의 **`AI 정리`** 버튼은 AI API를 호출합니다. 이 API는 별도의
**`mongle-ai` 서비스**가 제공하며, 이 저장소에서 실행하지 않습니다.

- AI 기능을 직접 확인하려면 `mongle-ai` 저장소의 안내대로 서비스를 먼저 띄웁니다.
- 화면은 `VITE_AI_API_BASE`(기본 `http://127.0.0.1:8010`) 주소로 요청을 보냅니다.

> AI API가 꺼져 있어도 화면은 정상 동작합니다. 이때는 앱에 내장된
> **로컬 대체 로직(fallback)**으로 할 일을 나눕니다. 그래서 화면만 개발할
> 때는 `npm run web:dev`만 써도 됩니다.

## 환경 변수 설정 (선택)

기본값으로도 동작하지만, 주소를 바꾸고 싶다면 예시 파일을 복사해 사용합니다.

```bash
cp apps/game/.env.example apps/game/.env.local
```

| 변수 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `VITE_GODOT_EXPORT_PATH` | 아니오 | `/godot/index.html` | iframe이 불러올 Godot 화면 경로 |
| `VITE_AI_API_BASE` | 아니오 | `http://127.0.0.1:8010` | AI API 기본 주소 |

> `.env.local`은 개인 로컬 설정이라 Git에 커밋하지 않습니다. (이미 무시 처리됨)
> `VITE_`로 시작하는 변수만 화면 코드에서 읽을 수 있습니다(Vite 규칙).

## Godot 화면 내보내기 (선택)

마을 화면(Godot)을 수정했다면, 브라우저에서 보이도록 다시 내보내야 합니다.
Godot 4.x가 설치되어 있어야 합니다.

```bash
npm run web:godot:export
```

내보낸 결과는 `public/godot/index.html`에 저장되고, React 앱이 이를
`/godot/index.html` 경로로 iframe에 띄웁니다.

Godot 에디터를 열어 화면을 편집하려면:

```bash
npm run web:godot
```

## 빌드(배포용 만들기)

실제 배포에 쓰는 결과물을 만들려면:

```bash
npm run web:build
```

이 명령은 타입 검사(`tsc`)를 먼저 하고, 통과하면 Vite 빌드를 만듭니다.
빌드 결과는 `apps/game/dist/`에 생깁니다. 빌드를 미리 확인하려면:

```bash
npm run web:preview
```

## 명령어 치트시트

작업 공간 루트에서 실행하는 명령어입니다.

| 명령어 | 무엇을 하나요? | 언제 쓰나요? |
| --- | --- | --- |
| `npm install` | 도구 설치 + Git 훅 연결 | 프로젝트 처음 받았을 때 |
| `npm run web:install` | 화면 앱(`apps/game`) 의존성 설치 | 처음 세팅 또는 의존성 변경 후 |
| `npm run web:dev` | React 개발 서버 실행 | 화면 개발할 때 |
| `npm run web:build` | 타입 검사 + 배포용 빌드 | 빌드가 깨지지 않는지 볼 때 |
| `npm run web:preview` | 빌드 결과 미리보기 | 빌드 결과를 확인할 때 |
| `npm run web:typecheck` | TypeScript 타입 검사 | 타입 실수를 찾을 때 |
| `npm run web:godot` | Godot 에디터 열기 | 마을 화면을 편집할 때 |
| `npm run web:godot:export` | Godot 화면 내보내기 | 마을 화면을 바꾼 뒤 |
| `npm run check:fix` | 코드 검사 + 자동 수정 | 커밋 전 코드 정리 |
| `npm run ci-check` | 검사 + 타입검사 + 빌드 한 번에 | 푸시 전, CI와 똑같이 확인할 때 |

코드 품질·커밋 검사 명령어는 [code-quality-guide.md](../../../docs/code-quality-guide.md)에
더 자세히 정리되어 있습니다.

## 잘 안 될 때

- **`npm run web:dev`가 안 켜져요:** 루트에서 `npm install` →
  `npm run web:install`을 다시 실행했는지 확인하세요.
- **마을 화면(iframe)이 비어 있어요:** `npm run web:godot:export`를 한 번
  실행해 Godot 화면을 내보내세요. Godot 4.x 설치가 필요합니다.
- **`AI 정리` 버튼이 동작 안 해요:** `mongle-ai` 서비스(AI API)가 꺼져 있는
  것입니다. 그 서비스를 띄우거나, 그냥 로컬 대체 로직으로 사용해도 됩니다.
- **포트가 이미 사용 중이라고 나와요:** 다른 터미널에서 같은 서버가 켜져
  있을 수 있습니다. 기존 프로세스를 끄고 다시 실행하세요.
- **훅(검사)이 아예 안 돌아요:** 루트에서 `npm install`을 다시 실행해
  Git 훅을 재연결하세요.
