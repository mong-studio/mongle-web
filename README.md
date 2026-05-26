# Mongle Web

몽글마을 제품을 한 작업공간에서 관리하기 위한 루트 프로젝트입니다.

현재 루트에는 화면과 AI 기능이 한 워크스페이스 안에 정리되어 있습니다.

| 경로 | 역할 | 실행 |
|---|---|---|
| `apps/game/` | Phaser + Vite 기반 마을 화면 MVP | `npm run web:dev` |
| `packages/ai/` | Python 기반 캐릭터/TODO/퀘스트/피드 AI 에이전트, 로컬 API, Streamlit 데모 | `npm run ai:api` / `npm run ai:demo` |

## 통합 방식

화면과 AI 기능은 같은 루트에서 실행하지만 런타임은 분리합니다.

- 화면 앱은 브라우저에서 실행되는 TypeScript/Vite/Phaser 프로젝트입니다.
- AI 기능은 Python 패키지이며 OpenAI, LangGraph, 저장소 포트, 테스트가 중심입니다.
- `packages/ai/api/server.py` 가 로컬 HTTP API를 열고, `apps/game` 화면이 TODO 입력을 `/api/todos/split` 으로 보냅니다.

`OPENAI_API_KEY` 가 있으면 기존 TODO LLM 어댑터를 사용하고, 없으면 로컬 분해기로 동작해서 화면 통합을 바로 확인할 수 있습니다. 기본 API 주소는 `http://127.0.0.1:8010` 입니다.

## 빠른 실행

필요 도구:

- Node.js/npm: 화면 앱 실행
- uv: AI 패키지 설치, 테스트, Streamlit 데모 실행

프론트엔드 화면:

```bash
npm run web:install
npm run web:dev
```

AI Streamlit 데모:

```bash
cd packages/ai
uv sync --extra ui
uv run streamlit run streamlit_app/app.py
```

게임 화면 + AI API 함께 실행:

```bash
npm run dev
```

## 문서

- 제품 스펙: `packages/ai/docs/PRODUCT_SPEC.md`
- 피처 인덱스: `packages/ai/docs/FEATURES.md`
- 화면 MVP 인수인계: `apps/game/docs/HANDOFF.md`
- 통합 구조 메모: `docs/PROJECT_STRUCTURE.md`
