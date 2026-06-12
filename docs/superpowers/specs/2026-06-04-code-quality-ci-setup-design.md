# mongle-web 코드 품질 & CI 셋업 설계

- 작성일: 2026-06-04
- 상태: 승인됨 (구현 대기)
- 대상 저장소: `mongle-web` (React 18 + Vite 5 + TypeScript)
- 참고: `mongle-server`의 Ruff / pre-commit / GitHub Actions / 초보자 가이드 구성

## 1. 배경과 목표

현재 `mongle-web`에는 코드 린트·포맷·CI·Git 훅·커밋 컨벤션이 전혀 없다.
`typecheck` 스크립트만 존재하고 `.github` 폴더도 없다.

목표는 `mongle-server`가 갖춘 코드 품질 체계를 React/TypeScript 진영의
2026년 표준 도구로 대응시켜, **초보자 팀원도 쉽게 따라 할 수 있는 설정과 한글 가이드**를
함께 제공하는 것이다.

비목표(이번 범위 아님):
- 테스트 프레임워크(Vitest) 및 커버리지 게이트 → 문서에 "다음 단계"로만 안내
- `packages/ai`(Python) toolchain → 별도 체계라 제외
- 배포 워크플로우(GitHub Actions → Docker → S3) → 이미 별도로 운영되며 건드리지 않음

## 2. 도구 매핑 (mongle-server 대응표)

| mongle-server (Python) | mongle-web (React/TS) | 역할 |
|---|---|---|
| Ruff | Biome | 린트 + 포맷 + import 정렬 (단일 Rust 도구) |
| mypy | tsc (`web:typecheck`) | 타입 검사 |
| pre-commit 프레임워크 | Husky + lint-staged | 커밋/푸시 전 자동 검사 |
| Commitizen | commitlint | Conventional Commits 강제 |
| Makefile | npm scripts (루트 최상위) | 통일된 명령어 |
| GitHub Actions `ci.yml` | GitHub Actions `ci.yml` (품질 전용) | PR/푸시 시 자동 검증 |
| `setup-guide.md` / `git-strategy.md` | `docs/code-quality-guide.md` | 초보자용 한글 가이드 |

선택 근거 (2026 트렌드):
- **Biome**: ESLint+Prettier 두 도구를 단일 Rust 바이너리로 대체. 서버의 Ruff와 정확히
  같은 철학(빠름·단일 설정·lint+format 통합)이라 두 저장소를 한 멘탈 모델로 설명 가능.
- **Husky + lint-staged + commitlint**: JS 진영에서 가장 널리 쓰이며 자료가 풍부.
- **npm scripts(루트 최상위)**: 추가 toolchain 없이 한 곳에서 명령어를 통일.

## 3. 파일 구성

모든 설정 파일은 git 루트(`mongle-web/`)에 둔다.
Husky 훅은 git 루트에 있어야 하고, Biome는 루트에서 `apps/game`을 대상으로 검사하며,
향후 추가될 JS 앱도 같은 설정을 공유할 수 있기 때문이다.

### 3.1 새로 만드는 파일

| 파일 | 목적 |
|---|---|
| `biome.json` | 린트 + 포맷 + import 정렬 설정 |
| `commitlint.config.js` | 커밋 메시지 컨벤션 |
| `.husky/pre-commit` | 스테이징 파일에 lint-staged 실행 |
| `.husky/commit-msg` | commitlint 실행 |
| `.husky/pre-push` | `npm run ci-check` 실행 |
| `.github/workflows/ci.yml` | 품질 검사 전용 CI (배포와 독립) |
| `.github/pull_request_template.md` | PR 템플릿 (서버 톤) |
| `.vscode/settings.json` | Biome 기본 포매터 + format on save |
| `docs/code-quality-guide.md` | 초보자용 한글 메인 가이드 |

### 3.2 수정하는 파일

| 파일 | 변경 내용 |
|---|---|
| 루트 `package.json` | devDependencies, scripts, `lint-staged` 설정 추가 |

## 4. 상세 설계

### 4.1 `biome.json`

- Biome 2.x 스키마 사용.
- `formatter`: 활성화. indentStyle = space, indentWidth = 2, quoteStyle = double,
  lineWidth = 100 (apps/game tsconfig 및 기존 코드 스타일과 충돌 없도록 보수적으로).
- `linter`: `recommended` 규칙 활성화 + React 도메인 규칙(hooks 규칙 포함).
- `assist`(import 정렬): 활성화하여 import 자동 정렬.
- `files.includes`: `apps/game/src/**`.
- 제외: `dist`, `legacy`, `public`, `node_modules`, `packages/**`.
- `vcs`: git 연동 + `.gitignore` 존중.

검증: 기존 `apps/game/src`에 `biome check`를 실행했을 때 자동 수정 가능한 항목만
나오고, 수정 불가한 치명적 오류로 빌드가 막히지 않아야 한다. 초기 도입 시
`biome check --write`로 한 번 정리한 결과를 커밋에 포함한다.

### 4.2 루트 `package.json` 스크립트

```jsonc
{
  "scripts": {
    "lint": "biome lint .",
    "format": "biome format --write .",
    "check": "biome check .",
    "check:fix": "biome check --write .",
    "ci-check": "biome ci . && npm run web:typecheck && npm run web:build",
    "prepare": "husky"
  }
}
```

- 기존 `web:typecheck`, `web:build`는 그대로 재사용.
- `check:fix` = 평소 작업용(자동 수정), `ci-check` = 푸시 전/CI 전체 검증.
- `prepare`는 `npm install` 시 Husky를 자동 설치(초보자가 별도 명령 불필요).

devDependencies (루트):
`@biomejs/biome`, `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`.

`lint-staged` 설정 (package.json 내):

```jsonc
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx,json,css}": "biome check --write --no-errors-on-unmatched"
  }
}
```

### 4.3 commitlint (`commitlint.config.js`)

- `@commitlint/config-conventional` 확장.
- `type-enum`을 서버와 통일: `feat`, `fix`, `docs`, `refactor`, `chore`, `perf`,
  `revert`, `style`, `test`.
- 형식: `type(scope): subject` — 서버 `git-strategy.md`와 동일 규칙.

### 4.4 Husky 훅

| 훅 | 동작 | 서버 대응 |
|---|---|---|
| `pre-commit` | `npx lint-staged` | ruff-check + ruff-format (변경 파일) |
| `commit-msg` | `npx commitlint --edit "$1"` | commitizen check |
| `pre-push` | `npm run ci-check` | `make ci-check` |

### 4.5 CI (`.github/workflows/ci.yml`)

품질 검사 전용 독립 워크플로우. 배포 워크플로우(Docker→S3)와 분리.

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "npm"
      - run: npm ci
      - run: npx biome ci .
      - run: npm run web:typecheck
      - run: npm run web:build
```

- `biome ci`는 lint+format 검사를 read-only로 수행(자동 수정 안 함).
- DB/서비스 컨테이너 불필요 → 서버 ci.yml에서 해당 부분 제거.
- `npm ci`는 루트 `package-lock.json` 기준. (루트 lockfile 생성이 선행 조건.)

### 4.6 `.vscode/settings.json`

- `editor.defaultFormatter`: `biomejs.biome`
- `editor.formatOnSave`: true
- `editor.codeActionsOnSave`: import 정리 + 안전한 자동 수정
- Biome VS Code 확장 설치 권장은 가이드 문서에서 안내.

### 4.7 가이드 문서 (`docs/code-quality-guide.md`)

서버의 친절한 한글 톤 + 치트시트 표 스타일 계승. 구성:

1. **이게 왜 필요한가요?** — 1문단, 초보자 눈높이
2. **처음 한 번만: 설치** — `npm install` → Husky 자동 연결 확인
3. **명령어 치트시트** — 표(명령어 / 무엇을 하나요 / 언제 쓰나요)
4. **Biome이 뭔가요?** — 린트·포맷 개념을 쉽게
5. **저장할 때 자동 정리** — VS Code Biome 확장 + format on save
6. **커밋 메시지 규칙** — Conventional Commits 표 (서버와 동일)
7. **Git 훅이 막을 때** — pre-commit/commit-msg/pre-push가 막는 이유 + 해결법
8. **CI가 빨간불일 때** — GitHub Actions 결과 읽는 법
9. **자주 막히는 부분** — 트러블슈팅
10. **다음 단계** — Vitest 테스트 & 커버리지 게이트(서버 pytest/80% 대응) 추후 도입 안내

## 5. 구현 순서 (개요)

1. 루트 `package.json`에 devDeps/scripts/lint-staged 추가 후 `npm install`로 lockfile 생성.
2. `biome.json` 작성 → `npm run check:fix`로 기존 코드 1회 정리.
3. `commitlint.config.js` 작성.
4. Husky 훅 3종 추가, `prepare` 동작 확인.
5. `.github/workflows/ci.yml`, `pull_request_template.md` 작성.
6. `.vscode/settings.json` 작성.
7. `docs/code-quality-guide.md` 작성.
8. 로컬에서 전체 검증: `npm run ci-check` 통과, 더미 커밋으로 훅 동작 확인.

## 6. 위험과 완화

- **기존 코드가 Biome 규칙에 다수 위반**: 초기 `check:fix` 1회 실행분을 별도 커밋으로
  분리해 리뷰 부담을 줄인다.
- **루트 lockfile 부재**: 현재 루트에 `package-lock.json`이 없으므로 devDeps 추가 후
  `npm install`로 생성해야 CI의 `npm ci`가 동작한다.
- **Husky가 CI에서 불필요하게 동작**: `prepare`는 `npm ci` 시에도 실행되므로 CI에서
  훅이 git 작업을 방해하지 않는지 확인(일반적으로 문제 없음).
- **에디터 미설정 팀원**: format on save가 없어도 pre-commit이 막아주므로 안전망 존재.
