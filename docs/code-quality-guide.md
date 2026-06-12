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
| `npm run typecheck` | TypeScript 타입 오류를 검사합니다. | 타입 실수를 찾을 때 |
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
