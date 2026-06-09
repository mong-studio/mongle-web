# 프로젝트 가이드 (프론트엔드)

이 문서는 mongle-web의 **구조**와 **코드를 어디에 둘지**를 설명합니다.
"이 파일은 왜 여기 있지?", "새 코드는 어디에 만들지?"가 궁금할 때 읽어 주세요.

- 설치와 실행 방법: [setup-guide.md](setup-guide.md)
- Git·커밋·PR 방법: [git-strategy.md](git-strategy.md)
- 코드 품질·린트·커밋 검사: [../../../docs/code-quality-guide.md](../../../docs/code-quality-guide.md)
- 작업 공간 전체 구조: [../../../docs/PROJECT_STRUCTURE.md](../../../docs/PROJECT_STRUCTURE.md)

## 큰 그림

`mongle-web`은 **프론트엔드 작업 공간(workspace)**입니다.

```text
mongle-web/
├── apps/
│   └── game/        # 화면: React + Vite 셸 (Godot 마을 화면을 iframe으로 embed)
├── docs/            # 작업 공간 전체 문서
└── package.json     # 루트 공통 명령어 (web:*, 품질 검사)
```

AI 기능(할 일 정리 등)은 별도의 **`mongle-ai` 서비스**가 제공하며, 화면이 HTTP로
그 API를 호출합니다. 화면은 AI API가 꺼져 있어도 로컬 대체 로직으로 동작하므로,
프론트엔드를 독립적으로 개발할 수 있습니다.

## 기본 원칙

- 화면 코드는 `apps/game` 안에서 작업합니다. AI(Python) 코드는 별도 저장소
  `mongle-ai`에 있으며, 화면은 그 API를 호출만 합니다.
- 공통 명령어는 루트 `package.json`에 모여 있습니다. (`npm run web:dev` 등)
- 코드 모양·품질은 **Biome**가 자동으로 맞춥니다. 규칙을 외우지 말고
  저장·커밋하면 됩니다. ([code-quality-guide.md](../../../docs/code-quality-guide.md))
- `legacy/`의 파일은 **참고용**입니다. 실제 앱 코드에서 import하지 않습니다.
- 구조·실행 방법·동작이 바뀌면 문서도 같이 업데이트합니다.

## `apps/game` 안에는 무엇이 있나요?

| 경로 | 역할 |
| --- | --- |
| `src/main.tsx` | React 진입점. iframe 셸, 할 일/타이머 UI, AI API 호출 로직 |
| `src/style.css` | 화면 전체(iframe 포함) 스타일 |
| `src/vite-env.d.ts` | `VITE_` 환경 변수의 TypeScript 타입 선언 |
| `index.html` | Vite가 사용하는 HTML 진입점 |
| `vite.config.ts` | Vite 빌드 설정 |
| `tsconfig.json` | TypeScript 설정 |
| `godot/` | Godot 프로젝트(마을 화면 원본): 씬, 스크립트, 에셋 |
| `public/godot/` | Godot에서 내보낸(export) 웹 결과물. iframe이 이걸 불러옴 |
| `dist/` | `web:build`로 만든 배포 결과물 (자동 생성) |
| `legacy/` | 참고 전용 자료. 앱 코드에서 import 금지 |
| `docs/` | 이 프로젝트 문서 |

## 화면과 Godot, AI는 어떻게 연결되나요?

```text
apps/game (React 셸)
  └─ iframe → /godot/index.html        (public/godot 의 Godot 웹 export)
  └─ fetch  → VITE_API_BASE/api/v1/todos/*        (Django 서버 → mongle-ai api/v1 API)
```

- 마을 그래픽·상호작용은 **Godot**가 그립니다. React는 이를 iframe으로 감쌉니다.
- `AI 정리` 버튼은 **Django API**에 할 일을 보내고, Django가 `mongle-ai` api/v1 API를 호출해 잘게 나눕니다.
  API가 없으면 화면에 내장된 로컬 대체 로직을 씁니다.

## 코드를 어디에 둘까요?

새 코드를 만들 때는 먼저 "이게 어떤 책임인가"를 생각합니다.

| 상황 | 위치 |
| --- | --- |
| React 화면 UI·상태·이벤트 | `apps/game/src/` (`main.tsx` 등) |
| 화면 스타일 | `apps/game/src/style.css` |
| 새 환경 변수 추가 | `apps/game/.env.example` + `src/vite-env.d.ts`에 타입 추가 |
| 마을 그래픽·맵·게임 상호작용 | `apps/game/godot/scripts/`, `godot/scenes/` |
| AI 기능(할 일 분리 등) | 별도 저장소 `mongle-ai` (이 저장소 아님) |
| 작업 공간 공통 명령어 | 루트 `package.json` scripts |
| 팀원이 읽어야 할 문서 | `docs/` 또는 `apps/game/docs/` |

> 파일이 너무 커지면(대략 800줄 초과) 기능 단위로 나누는 것을 고려하세요.
> "타입별"이 아니라 "기능/도메인별"로 묶는 것이 읽기 좋습니다.

## 개발할 때 확인할 것

- 변경하려는 파일이 이번 작업 목적과 관련 있는지 확인합니다.
- 환경 변수를 추가했다면 `.env.example`과 `vite-env.d.ts`를 함께 업데이트했는지
  확인합니다.
- 화면 동작이 바뀌면 [QA_HARNESS.md](QA_HARNESS.md)의 수동 점검 항목을 확인합니다.
- 커밋 전 `npm run check:fix`로 코드를 정리하고, 푸시 전 `npm run ci-check`로
  CI와 동일하게 검증합니다.
- 팀원이 이해해야 하는 구조 변경은 문서에 남깁니다.

## 막혔을 때

혼자 오래 붙잡고 있기보다 아래 정보를 정리해서 팀원에게 공유합니다.

- 무엇을 하려고 했는지
- 어떤 명령어를 실행했는지
- 어떤 에러가 났는지
- 이미 시도해 본 해결 방법은 무엇인지

좋은 질문 예:

```text
할 일 입력창에 AI 정리 버튼을 연결하려고 했습니다.
npm run web:dev 로 실행했는데 화면은 뜨지만 버튼을 눌러도 반응이 없습니다.
브라우저 콘솔에 http://127.0.0.1:8010 연결 거부 에러가 납니다.
제가 확인한 것은 mongle-ai 서비스(AI API)가 켜져 있는지 여부입니다.
```
