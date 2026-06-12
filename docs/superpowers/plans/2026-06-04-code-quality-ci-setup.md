# mongle-web 코드 품질 & CI 셋업 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** mongle-web(React/Vite/TS)에 Biome 기반 린트·포맷, Husky/lint-staged/commitlint Git 훅, GitHub Actions 품질 CI, 그리고 초보자용 한글 가이드를 추가한다.

**Architecture:** 모든 설정은 git 루트(`mongle-web/`)에 둔다. Biome 한 도구가 린트+포맷+import 정렬을 담당하고(서버의 Ruff 대응), tsc가 타입 검사, Husky가 커밋/푸시 전 자동 검사를 건다. CI는 배포 워크플로우와 분리된 품질 전용 워크플로우다.

**Tech Stack:** Biome 2.4.x, Husky 9.x, lint-staged 17.x, commitlint 21.x(@commitlint/config-conventional), GitHub Actions(Node 24), npm.

**스펙:** `docs/superpowers/specs/2026-06-04-code-quality-ci-setup-design.md`

---

## File Structure

| 파일 | 상태 | 책임 |
|---|---|---|
| `package.json` (루트) | 수정 | devDeps, scripts, lint-staged 설정 |
| `package-lock.json` (루트) | 생성 | 루트 의존성 lockfile (CI의 `npm ci`용) |
| `biome.json` | 생성 | 린트 + 포맷 + import 정렬 설정 |
| `commitlint.config.js` | 생성 | 커밋 메시지 컨벤션 |
| `.husky/pre-commit` | 생성 | lint-staged 실행 |
| `.husky/commit-msg` | 생성 | commitlint 실행 |
| `.husky/pre-push` | 생성 | `npm run ci-check` 실행 |
| `.github/workflows/ci.yml` | 생성 | 품질 검사 CI |
| `.github/pull_request_template.md` | 생성 | PR 템플릿 |
| `.vscode/settings.json` | 생성 | 에디터 포맷 온 세이브 |
| `.vscode/extensions.json` | 생성 | 권장 확장 안내 |
| `.gitignore` (루트) | 수정 | `.vscode` 공유 파일 예외 추가 |
| `docs/code-quality-guide.md` | 생성 | 초보자용 한글 가이드 |

> **참고:** 이 작업은 코드 로직이 아니라 도구 설정이라 단위 테스트 대신 "명령어를 실행해 출력으로 검증"하는 방식을 사용한다. 작업은 `chore/project-setup` 브랜치에서 진행한다.

> **결정 사항 (스펙에서 보강):**
> - **commitlint 타입:** 스펙은 서버와 동일한 제한 집합을 제안했으나, 사용자의 글로벌 git 워크플로우가 `ci:`/`build:` 타입을 쓰고 이번 작업 자체가 CI 추가다. 제한 집합은 우리의 `ci:` 커밋을 막으므로 `@commitlint/config-conventional` 기본 타입(서버 타입의 상위집합: build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test)을 그대로 사용한다.
> - **`.vscode` 공유:** 루트 `.gitignore`가 `.vscode/`를 무시하므로, 공유할 `settings.json`/`extensions.json`만 예외(`!`)로 추가한다.

---

## Task 1: 루트 package.json — 의존성·스크립트·lint-staged + lockfile 생성

**Files:**
- Modify: `package.json`
- Create: `package-lock.json`

- [ ] **Step 1: 루트 `package.json`을 아래 내용으로 교체**

기존 `scripts`는 유지하고 `lint`/`format`/`check`/`check:fix`/`ci-check`/`prepare`와 `devDependencies`, `lint-staged`를 추가한다.

```json
{
  "name": "mongle-web-workspace",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "npm run ai:api & npm run web:dev",
    "web:install": "npm install --prefix apps/game",
    "web:dev": "npm run dev --prefix apps/game",
    "web:typecheck": "npm run typecheck --prefix apps/game",
    "web:build": "npm run build --prefix apps/game",
    "web:preview": "npm run preview --prefix apps/game",
    "ai:api": "cd packages/ai && uv run python -m api.server",
    "ai:test": "cd packages/ai && uv run pytest",
    "ai:demo": "cd packages/ai && uv run streamlit run streamlit_app/app.py",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "check": "biome check .",
    "check:fix": "biome check --write .",
    "ci-check": "biome ci . && npm run web:typecheck && npm run web:build",
    "prepare": "husky"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.16",
    "@commitlint/cli": "21.0.2",
    "@commitlint/config-conventional": "21.0.0",
    "husky": "9.1.7",
    "lint-staged": "17.0.7"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx,json,css}": "biome check --write --no-errors-on-unmatched"
  }
}
```

> 설치 시점에 `@commitlint/config-conventional`의 정확한 최신 버전이 다르면 `npm install`이 lockfile에 실제 버전을 기록한다. 위 버전이 존재하지 않으면 해당 항목을 `^21`로 두고 설치한다.

- [ ] **Step 2: 의존성 설치 (lockfile 생성)**

Run: `npm install`
Expected: 루트에 `node_modules/`와 `package-lock.json`이 생성된다. `prepare` 스크립트가 husky를 초기화하며 `.husky/` 디렉터리가 만들어진다(`.husky/_/` 포함). 에러 없이 종료.

- [ ] **Step 3: Biome 실행 가능 확인**

Run: `npx biome --version`
Expected: `2.4.16`(또는 설치된 2.4.x) 출력.

- [ ] **Step 4: 커밋**

```bash
git add package.json package-lock.json
git commit -m "chore: add code quality tooling dependencies and scripts"
```

> 이 시점엔 `biome.json`/훅이 아직 없어 `pre-push`나 `commit-msg` 검사가 동작하지 않는다(훅 파일 미생성). 정상이다.

---

## Task 2: biome.json + 기존 코드 1회 정리

**Files:**
- Create: `biome.json`
- Modify (자동): `apps/game/src/**` (포맷/정렬 결과)

- [ ] **Step 1: `biome.json` 생성**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.16/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "includes": [
      "apps/game/src/**",
      "*.json",
      "*.js",
      "!**/package-lock.json"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double"
    }
  }
}
```

- [ ] **Step 2: 포맷/정렬 자동 적용**

Run: `npm run check:fix`
Expected: Biome가 대상 파일을 정리한다. `apps/game/src`는 이미 2-space·double-quote라 변경은 적거나 없을 수 있다. 자동 수정 가능한 항목은 모두 적용되어 종료.

- [ ] **Step 3: 남은 진단 확인**

Run: `npm run check`
Expected 둘 중 하나:
- 진단 없음 → Step 4로 진행.
- error 레벨 진단이 남음 → 아래로 처리.

**남은 error 처리 기준:**
1. 진짜 버그/위험(예: 미사용 변수, 잘못된 타입)이면 해당 코드를 직접 고친다.
2. 이 코드베이스에서 의도된 패턴이라 당장 고치지 않을 스타일성 규칙이면 `biome.json`의 `linter.rules`에서 해당 규칙만 `"warn"`으로 낮춘다(=`biome ci`가 실패하지 않음). 예시 — 배열 index를 key로 쓰는 패턴이 남았다면:

```json
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noArrayIndexKey": "warn"
      }
    }
  }
```

규칙 카테고리/이름은 `npm run check` 출력의 각 진단 끝에 표시된다(예: `lint/suspicious/noArrayIndexKey`). 출력에 나온 카테고리(`suspicious`/`style`/`correctness` 등)와 규칙명을 그대로 사용한다.

- [ ] **Step 4: `check`와 `ci-check`가 통과하는지 검증**

Run: `npm run check`
Expected: error 레벨 진단 0개 (warn은 허용).

Run: `npm run ci-check`
Expected: `biome ci .` 통과 → `web:typecheck` 통과 → `web:build` 성공.

- [ ] **Step 5: 커밋**

```bash
git add biome.json apps/game/src
git commit -m "chore: add biome config and apply initial formatting"
```

---

## Task 3: commitlint 설정

**Files:**
- Create: `commitlint.config.js`

- [ ] **Step 1: `commitlint.config.js` 생성 (CommonJS)**

루트 `package.json`에 `"type": "module"`이 없으므로 `.js`는 CommonJS로 해석된다. 따라서 아래 CommonJS 형태로 작성한다.

```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
};
```

- [ ] **Step 2: 통과 케이스 검증**

Run: `echo "feat: add login button" | npx commitlint`
Expected: 출력 없음, 종료 코드 0 (통과).

- [ ] **Step 3: 실패 케이스 검증**

Run: `echo "added stuff" | npx commitlint`
Expected: 종료 코드 1, "type may not be empty" 등 에러 메시지 출력.

- [ ] **Step 4: 커밋**

```bash
git add commitlint.config.js
git commit -m "chore: add commitlint conventional config"
```

---

## Task 4: Husky 훅 3종

**Files:**
- Create: `.husky/pre-commit`
- Create: `.husky/commit-msg`
- Create: `.husky/pre-push`

> Task 1의 `npm install`에서 `prepare`가 husky를 초기화했으므로 `.husky/`가 이미 존재한다. 없다면 `npx husky init`을 먼저 실행한다(이 경우 husky가 만든 샘플 `.husky/pre-commit`은 아래 내용으로 덮어쓴다).

- [ ] **Step 1: `.husky/pre-commit` 생성**

```sh
npx lint-staged
```

- [ ] **Step 2: `.husky/commit-msg` 생성**

```sh
npx --no-install commitlint --edit "$1"
```

- [ ] **Step 3: `.husky/pre-push` 생성**

```sh
npm run ci-check
```

- [ ] **Step 4: 훅 파일 실행 권한 부여**

Run: `chmod +x .husky/pre-commit .husky/commit-msg .husky/pre-push`
Expected: 에러 없음.

- [ ] **Step 5: commit-msg 훅 동작 검증 (실패 케이스)**

스테이징할 더미 변경을 만든 뒤 잘못된 메시지로 커밋을 시도한다.

```bash
echo "" >> hook-test-placeholder.txt
git add hook-test-placeholder.txt
git commit -m "bad message"
```

Expected: commit-msg 훅이 commitlint로 막아 커밋 실패(종료 코드 1).

- [ ] **Step 6: 더미 파일 정리**

```bash
git restore --staged hook-test-placeholder.txt
rm hook-test-placeholder.txt
```

Expected: 더미 파일 삭제됨, 작업 트리에서 사라짐.

- [ ] **Step 7: 커밋 (올바른 메시지 + pre-commit 통과 확인)**

```bash
git add .husky/pre-commit .husky/commit-msg .husky/pre-push
git commit -m "chore: add husky git hooks for lint and commit checks"
```

Expected: pre-commit(lint-staged) 통과, commit-msg 통과, 커밋 성공.

---

## Task 5: VS Code 공유 설정 + .gitignore 예외

**Files:**
- Modify: `.gitignore`
- Create: `.vscode/settings.json`
- Create: `.vscode/extensions.json`

- [ ] **Step 1: `.gitignore`의 IDE 섹션 수정**

기존 줄:

```gitignore
# IDE
.idea/
.vscode/
```

아래로 교체(`.vscode`는 무시하되 공유 파일만 예외):

```gitignore
# IDE
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
```

- [ ] **Step 2: `.vscode/settings.json` 생성**

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit",
    "quickfix.biome": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

- [ ] **Step 3: `.vscode/extensions.json` 생성**

```json
{
  "recommendations": ["biomejs.biome"]
}
```

- [ ] **Step 4: 파일이 git에 추적되는지 검증**

Run: `git check-ignore .vscode/settings.json; echo "exit=$?"`
Expected: `exit=1` (무시되지 않음 = 추적 가능). check-ignore가 파일명을 출력하지 않아야 한다.

- [ ] **Step 5: 커밋**

```bash
git add .gitignore .vscode/settings.json .vscode/extensions.json
git commit -m "chore: add shared vscode settings for biome"
```

---

## Task 6: GitHub Actions 품질 CI + PR 템플릿

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/pull_request_template.md`

- [ ] **Step 1: `.github/workflows/ci.yml` 생성**

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "npm"

      - name: Install root dependencies
        run: npm ci

      - name: Install web app dependencies
        run: npm ci --prefix apps/game

      - name: Biome check
        run: npx biome ci .

      - name: Type check
        run: npm run web:typecheck

      - name: Build
        run: npm run web:build
```

> `web:typecheck`/`web:build`는 `apps/game`의 의존성이 필요하므로 별도 `npm ci --prefix apps/game` 단계를 넣는다. `apps/game/package-lock.json`은 이미 존재한다.

- [ ] **Step 2: `.github/pull_request_template.md` 생성**

```markdown
## Summary

<!-- 이 PR이 왜 필요한지 한두 줄로 작성합니다. -->

## Changes

<!-- 실제로 바꾼 내용을 목록으로 작성합니다. -->

-

## Checklist

- [ ] `npm run ci-check`를 실행했고 통과했다.
- [ ] 관련 없는 파일이 포함되지 않았다.
- [ ] 커밋 메시지가 Conventional Commits 형식이다.

## Test

<!-- 실행한 검증과 수동 확인을 적습니다. -->

## Notes

<!-- 리뷰어가 알아야 할 점을 적습니다. -->
```

- [ ] **Step 3: 워크플로우 YAML 문법 검증**

Run: `npx --yes js-yaml .github/workflows/ci.yml > /dev/null && echo "yaml ok"`
Expected: `yaml ok` 출력 (파싱 성공). 실패 시 들여쓰기 확인.

- [ ] **Step 4: 커밋**

```bash
git add .github/workflows/ci.yml .github/pull_request_template.md
git commit -m "ci: add quality check workflow and pr template"
```

---

## Task 7: 초보자용 한글 가이드 문서

**Files:**
- Create: `docs/code-quality-guide.md`

- [ ] **Step 1: `docs/code-quality-guide.md` 생성**

````markdown
# 코드 품질 가이드 (Biome · Git 훅 · CI)

이 문서는 코드 스타일 도구가 처음인 팀원이 mongle-web에서 안전하게 코드를 작성하고
커밋·푸시할 수 있도록 돕습니다.

프로젝트 구조는 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)를 확인해 주세요.

## 이게 왜 필요한가요?

여러 명이 함께 코드를 쓰면 들여쓰기, 따옴표, import 순서 같은 사소한 차이가 쌓여
리뷰가 어려워집니다. 이 프로젝트는 **Biome** 한 도구로 코드 모양을 자동으로 맞추고,
**Git 훅**으로 커밋·푸시 전에 자동 검사를 합니다. 여러분은 규칙을 외울 필요 없이
저장하고 커밋하면 됩니다.

## 처음 한 번만: 설치

프로젝트를 처음 받았다면 루트에서 아래를 실행합니다.

```bash
npm install
```

이 명령은 검사 도구를 설치하고 Git 훅을 자동으로 연결합니다.
연결이 됐는지 확인하려면 아래를 실행합니다.

```bash
ls .husky
```

`pre-commit`, `commit-msg`, `pre-push` 파일이 보이면 정상입니다.

## 명령어 치트시트

| 명령어 | 무엇을 하나요? | 언제 쓰나요? |
| --- | --- | --- |
| `npm run check` | 코드 문제를 검사만 합니다(고치지 않음). | 지금 상태가 깨끗한지 볼 때 |
| `npm run check:fix` | 검사하고 고칠 수 있는 것은 자동으로 고칩니다. | 커밋 전 코드 정리 |
| `npm run format` | 코드 모양(들여쓰기·따옴표)만 맞춥니다. | 모양만 빠르게 정리할 때 |
| `npm run lint` | 코드 품질 규칙만 검사합니다. | 잠재적 버그를 찾을 때 |
| `npm run web:typecheck` | TypeScript 타입 오류를 검사합니다. | 타입 실수를 찾을 때 |
| `npm run ci-check` | 검사 + 타입검사 + 빌드를 한 번에 합니다. | 푸시 전, CI와 똑같이 확인할 때 |

가장 자주 쓰는 흐름: 작업 → `npm run check:fix` → 커밋.

## Biome이 뭔가요?

Biome은 **린트(코드 품질 검사)** 와 **포맷(코드 모양 정리)** 을 한 번에 해주는 도구입니다.
예전에는 ESLint와 Prettier 두 도구를 따로 설치했지만, Biome은 하나로 빠르게 처리합니다.
(백엔드 mongle-server의 Ruff와 같은 역할입니다.)

- **린트:** "이 변수는 안 쓰는데?" 같은 잠재적 문제를 알려줍니다.
- **포맷:** 들여쓰기 2칸, 큰따옴표 등 모양을 자동으로 통일합니다.
- **import 정렬:** import 순서를 자동으로 정리합니다.

## 저장할 때 자동 정리 (추천)

매번 명령어를 치지 않아도, VS Code에서 저장만 하면 자동으로 정리되게 할 수 있습니다.

1. VS Code 확장 탭에서 **Biome**(`biomejs.biome`)을 설치합니다.
   - 이 프로젝트를 열면 추천 확장으로 안내됩니다.
2. `.vscode/settings.json`이 이미 포함되어 있어 **저장 시 자동 포맷**이 켜집니다.

이제 파일을 저장(⌘S)하면 코드가 자동으로 정리됩니다.

## 커밋 메시지 규칙

이 프로젝트는 **Conventional Commits** 형식을 사용합니다(백엔드와 동일).

기본 형식:

```text
type(scope): subject
```

`scope`는 선택입니다. 예: `feat(todo): add quest assign`.

| 타입 | 언제 쓰나요? | 예시 |
| --- | --- | --- |
| `feat` | 새 기능 추가 | `feat: add character modal` |
| `fix` | 버그 수정 | `fix: prevent empty todo save` |
| `docs` | 문서 추가/수정 | `docs: add code quality guide` |
| `refactor` | 동작은 그대로, 구조 개선 | `refactor: split app component` |
| `chore` | 설정·도구·의존성 작업 | `chore: update biome config` |
| `perf` | 성능 개선 | `perf: memoize quest list` |
| `ci` | CI/워크플로우 작업 | `ci: cache npm in actions` |
| `style` | 포맷 등 동작 무관 변경 | `style: format files` |
| `test` | 테스트 추가/수정 | `test: add todo split test` |

피해야 할 예: `fix: 수정`, `feat: 작업함`. 무엇을 했는지 구체적으로 적습니다.

## Git 훅이 막을 때

커밋·푸시할 때 자동 검사가 돌고, 문제가 있으면 막습니다. 당황하지 마세요.

| 훅 | 언제 도나요? | 막혔다면? |
| --- | --- | --- |
| `pre-commit` | `git commit` 직전 | 스테이징한 파일에 자동 수정 적용. 다시 `git add` 후 커밋. |
| `commit-msg` | 커밋 메시지 작성 직후 | 메시지를 `type: subject` 형식으로 고칩니다. |
| `pre-push` | `git push` 직전 | `npm run ci-check`가 실패한 것. 아래 "CI가 빨간불일 때" 참고. |

예를 들어 pre-commit이 파일을 자동 수정했다면, 바뀐 파일을 다시 더하고 커밋합니다.

```bash
git add -u
git commit -m "feat: add login button"
```

## CI가 빨간불일 때

PR을 올리면 GitHub Actions가 자동으로 검사합니다. 빨간 X가 뜨면:

1. PR 화면의 **Details**(또는 Checks 탭)를 클릭합니다.
2. 빨간색으로 표시된 단계(Biome check / Type check / Build)를 엽니다.
3. 로그의 에러 메시지를 읽습니다.
4. 로컬에서 같은 검사를 돌려 재현하고 고칩니다.

```bash
npm run ci-check
```

이게 통과하면 보통 CI도 통과합니다. 고친 뒤 다시 커밋·푸시하면 검사가 재실행됩니다.

## 자주 막히는 부분

- **`npm run check`가 error를 뱉어요:** 먼저 `npm run check:fix`로 자동 수정해 보세요.
  그래도 남으면 메시지의 규칙명(예: `lint/suspicious/...`)을 읽고 코드를 고칩니다.
- **커밋이 자꾸 거부돼요:** 메시지 형식 문제입니다. `feat:`, `fix:`, `docs:`처럼
  타입으로 시작했는지 확인하세요.
- **푸시가 오래 걸려요:** pre-push가 빌드까지 돌기 때문입니다. 정상입니다.
- **훅이 아예 안 돌아요:** `npm install`을 다시 실행해 훅을 재연결하세요.

## 다음 단계 (아직 없음)

지금은 테스트가 없어 CI에서 테스트를 돌리지 않습니다. 추후 화면/로직 테스트를
도입할 때는 **Vitest**를 추가하고, 백엔드의 pytest 커버리지 게이트(80%)처럼
커버리지 기준을 CI에 더할 수 있습니다.
````

- [ ] **Step 2: 가이드의 명령어가 실제 동작하는지 교차 검증**

Run: `npm run check && npm run web:typecheck`
Expected: 문서에 적힌 명령어들이 실제로 존재하고 통과한다.

- [ ] **Step 3: 커밋**

```bash
git add docs/code-quality-guide.md
git commit -m "docs: add beginner code quality guide"
```

---

## Task 8: 전체 엔드투엔드 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 품질 검사 통과 확인**

Run: `npm run ci-check`
Expected: `biome ci .` → `web:typecheck` → `web:build` 모두 성공.

- [ ] **Step 2: pre-commit 자동 수정 흐름 확인**

`apps/game/src/style.css` 끝에 의도적으로 포맷을 흐트러뜨린 줄을 넣고 커밋을 시도해 lint-staged가 정리하는지 확인한다.

```bash
printf "\n.hook-test{color:red}\n" >> apps/game/src/style.css
git add apps/game/src/style.css
git commit -m "style: temp css for hook test"
```

Expected: pre-commit이 lint-staged로 CSS를 포맷한 뒤 커밋 진행. 커밋 성공 시 `git show HEAD` 출력에서 `.hook-test`가 Biome 포맷(예: `color: red;` 공백·세미콜론 정리)된 형태로 들어갔는지 확인.

- [ ] **Step 3: 테스트용 변경 되돌리기**

```bash
git revert --no-edit HEAD
```

Expected: 방금 추가한 테스트용 CSS 커밋이 되돌려진다. `apps/game/src/style.css`가 원상 복구되었는지 `git status`로 확인.

- [ ] **Step 4: 잘못된 커밋 메시지 거부 확인**

```bash
git commit --allow-empty -m "wip"
```

Expected: commit-msg 훅이 거부(종료 코드 1). `wip`은 유효한 타입이 아니다.

- [ ] **Step 5: 최종 상태 확인**

Run: `git status && git log --oneline -8`
Expected: 작업 트리 깨끗, 위 Task들의 커밋이 순서대로 보인다.

---

## Self-Review 체크리스트 결과

- **스펙 커버리지:** 도구 매핑(Task 1·2·3·4·6), biome.json(Task 2), package.json 스크립트(Task 1), commitlint(Task 3), Husky 3종(Task 4), CI(Task 6), PR 템플릿(Task 6), .vscode(Task 5), 가이드 문서 10개 섹션(Task 7), 테스트 제외+다음 단계 안내(Task 7 마지막 섹션) — 모두 태스크로 매핑됨.
- **스펙 보강:** commitlint 타입은 config-conventional 기본값 사용(서버 타입의 상위집합, `ci:` 허용), `.gitignore`에 `.vscode` 예외 추가 — 두 가지를 상단 "결정 사항"에 명시.
- **타입/이름 일관성:** 스크립트명(`check`/`check:fix`/`ci-check`), 훅 파일명, 규칙 카테고리 명명이 전 태스크에서 일관됨.
