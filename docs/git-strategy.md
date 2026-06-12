# Git 전략과 PR 가이드

이 문서는 Git이 아직 익숙하지 않은 팀원이 안전하게 브랜치를 만들고, 최신 코드를
반영하고, PR을 올리는 방법을 설명합니다. 명령어는 모두 mongle-web(프론트엔드)
기준입니다.

- 프로젝트 설치와 실행: [setup-guide.md](setup-guide.md)
- 프로젝트 구조와 코드 위치: [project-guide.md](project-guide.md)
- 커밋 메시지·코드 품질 검사: [../../../docs/code-quality-guide.md](../../../docs/code-quality-guide.md)

## 목차

- [한눈에 보는 흐름](#한눈에-보는-흐름)
- [브랜치 이름](#브랜치-이름)
- [이슈란?](#이슈란)
- [작업 시작하기](#작업-시작하기)
- [작업 중 확인하기](#작업-중-확인하기)
- [커밋 전 체크리스트](#커밋-전-체크리스트)
- [커밋 메시지 컨벤션](#커밋-메시지-컨벤션)
- [최신 main 반영하기](#최신-main-반영하기)
- [Push와 PR 만들기](#push와-pr-만들기)
- [PR과 이슈 연결하기](#pr과-이슈-연결하기)
- [PR 올리기 전 최종 체크리스트](#pr-올리기-전-최종-체크리스트)
- [리뷰 받은 뒤](#리뷰-받은-뒤)
- [PR merge 후 브랜치 삭제하기](#pr-merge-후-브랜치-삭제하기)
- [자주 하는 실수](#자주-하는-실수)
- [막혔을 때 공유할 정보](#막혔을-때-공유할-정보)

## 한눈에 보는 흐름

```text
이슈 확인 또는 생성
-> main 최신화
-> 작업 브랜치 생성
-> 작업
-> 변경 파일 확인
-> 검증 (npm run ci-check)
-> 커밋
-> push
-> PR 생성
-> 리뷰 반영
-> merge
-> 브랜치 삭제
```

가장 중요한 원칙은 아래 4가지입니다.

- `main` 브랜치에서 직접 작업하지 않습니다.
- 작업 전후로 `git status`와 `git diff`를 자주 확인합니다.
- 내가 바꾼 파일만 커밋합니다.
- PR은 작게 만들고, 관련 이슈를 연결합니다.

## 브랜치 이름

브랜치는 작업 종류와 목적이 보이게 만듭니다.

| prefix      | 언제 쓰나요?                          | 예시                         |
| ----------- | ------------------------------------- | ---------------------------- |
| `feat/`     | 새 기능을 만들 때                     | `feat/todo-ai-button`        |
| `fix/`      | 버그를 고칠 때                        | `fix/timer-reset-bug`        |
| `docs/`     | 문서만 수정할 때                      | `docs/git-strategy`          |
| `refactor/` | 동작은 그대로 두고 구조를 개선할 때   | `refactor/split-main-tsx`    |
| `chore/`    | 설정, 도구, 빌드, 의존성 작업을 할 때 | `chore/update-hooks`         |

## 이슈란?

이슈는 "해야 할 일"을 적어두는 공간입니다.

예를 들어 아래처럼 사용할 수 있습니다.

- 버그 제보: 타이머를 리셋해도 시간이 그대로 남습니다.
- 기능 요청: 할 일에 마감일을 추가하고 싶습니다.
- 작업 메모: Git 전략 문서를 정리합니다.

작업을 시작하기 전에 관련 이슈가 있는지 먼저 확인합니다. 관련 이슈가 없고
작업이 작지 않다면 새 이슈를 만들면 좋습니다.

### 이슈 만들기

GitHub에서 이슈를 만드는 기본 흐름은 아래와 같습니다.

1. GitHub 저장소로 이동합니다.
2. `Issues` 탭을 클릭합니다.
3. `New issue`를 클릭합니다.
4. 제목에 해야 할 일을 짧게 씁니다.
5. 본문에 배경, 할 일, 완료 기준을 적습니다.
6. `Submit new issue`를 클릭합니다.

좋은 이슈 예:

```text
Title: 타이머 리셋이 동작하지 않는 문제를 고친다

Background:
리셋 버튼을 눌러도 남은 시간이 초기화되지 않습니다.

Todo:
- 리셋 핸들러에서 시간 상태를 초기화
- 리셋 동작 수동 점검

Done:
- 리셋 후 시간이 처음 값으로 돌아온다
- npm run ci-check 통과
```

## 작업 시작하기

작업은 항상 최신 `main`에서 새 브랜치를 만들어 시작합니다.

```bash
git status
git switch main
git pull
git switch -c feat/my-task
```

`git status`에서 변경 파일이 보이면 바로 브랜치를 바꾸지 말고 먼저 확인합니다.

```bash
git diff
```

아직 커밋하지 않은 내 작업이 있다면 커밋하거나 임시 저장합니다.

```bash
git stash push -m "작업 내용 임시 저장"
```

임시 저장한 작업을 다시 가져올 때는 아래를 사용합니다.

```bash
git stash list
git stash pop
```

## 작업 중 확인하기

작업 중에는 자주 확인합니다.

```bash
git status
git diff
```

특정 파일만 보고 싶을 때는 아래처럼 확인합니다.

```bash
git diff src/main.tsx
```

특히 아래 파일·폴더는 실수로 커밋하지 않도록 주의합니다.

- `.env`, `.env.local` (개인 환경 설정)
- `node_modules/` (설치된 패키지)
- `dist/` (빌드 결과물)
- 이번 작업과 상관없는 화면/맵 파일
- IDE나 포맷터가 자동으로 바꾼 관련 없는 파일

의도하지 않은 파일이 보이면 아래를 생각합니다.

- 내가 직접 수정한 파일인가?
- 포맷터(Biome)가 자동으로 바꾼 파일인가?
- 이번 PR 목적과 관련 있는가?
- 팀원이 최근 작업한 파일인가?

관련 없는 파일은 커밋에 넣지 않습니다. 이미 staged 상태라면 staging에서만 뺍니다.

```bash
git restore --staged path/to/file.tsx
```

파일 내용을 되돌리는 명령어는 조심해서 사용합니다.

```bash
git restore path/to/file.tsx
```

이 명령어는 해당 파일의 내 로컬 변경을 지웁니다. 확실하지 않으면 먼저
팀원에게 물어봅니다.

## 커밋 전 체크리스트

커밋 전에는 아래 순서로 확인합니다.

```bash
git status
git diff
npm run check:fix
```

체크리스트:

- 변경 파일이 이번 작업 목적과 관련 있나요?
- `.env`, `.env.local` 같은 로컬 설정 파일이 포함되지 않았나요?
- 환경 변수를 추가했다면 `.env.example`과 `vite-env.d.ts`도 함께 바꿨나요?
- 화면 동작이 바뀌었다면 수동 점검([QA_HARNESS.md](QA_HARNESS.md))을 했나요?
- `npm run check:fix`로 코드를 정리했나요?

필요한 파일만 staging합니다.

```bash
git add src/main.tsx
git add src/style.css
```

`git add .`는 편하지만 관련 없는 파일까지 들어갈 수 있습니다. 사용했다면
반드시 다시 확인합니다.

```bash
git status
git diff --staged
```

이제 커밋합니다. 메시지는 아래 컨벤션을 따릅니다.

```bash
git commit -m "feat: add ai cleanup button"
```

> 커밋하면 `commit-msg` 훅이 메시지 형식을, `pre-commit` 훅이 코드 모양을
> 자동으로 검사합니다. 막히면 [code-quality-guide.md](../../../docs/code-quality-guide.md)의
> "Git 훅이 막을 때"를 참고하세요.

## 커밋 메시지 컨벤션

이 프로젝트는 **Conventional Commits** 형식을 사용하고, `commitlint`로 검사합니다.

기본 형식은 아래와 같습니다.

```text
type(scope): subject
```

`scope`는 선택입니다. 어떤 화면이나 모듈을 바꿨는지 표시하고 싶을 때 씁니다.

예:

```text
feat(todo): add ai cleanup button
fix(timer): reset remaining time on reset
docs: add git strategy guide
```

본문과 footer가 필요하면 제목 아래에 빈 줄을 두고 작성합니다.

```text
fix(todo): prevent empty todo save

Block adding a todo when the input is blank.

Resolves: #12
```

### 우리 프로젝트에서 쓰는 타입

현재 프로젝트의 `commit-msg` 훅(commitlint)은 아래 타입을 허용합니다.

| 타입       | 언제 쓰나요?                                  | 예시                                    |
| ---------- | --------------------------------------------- | --------------------------------------- |
| `feat`     | 새로운 기능을 추가할 때                       | `feat(todo): add ai cleanup button`     |
| `fix`      | 버그를 고칠 때                                | `fix(timer): reset remaining time`      |
| `docs`     | 문서를 추가하거나 수정할 때                   | `docs: add setup guide`                 |
| `refactor` | 동작은 그대로 두고 코드 구조를 개선할 때      | `refactor: split main.tsx`              |
| `chore`    | 개발 환경, 설정, 도구, 의존성 작업을 할 때    | `chore: update biome config`            |
| `perf`     | 성능을 개선할 때                              | `perf: memoize resident list`           |
| `ci`       | CI/워크플로우 작업을 할 때                    | `ci: cache npm in actions`              |
| `style`    | 포맷 등 동작과 무관한 변경                    | `style: format files`                   |
| `test`     | 테스트를 추가하거나 수정할 때                 | `test: add todo split test`             |
| `revert`   | 이전 커밋을 되돌릴 때                         | `revert: revert ai button change`       |

헷갈릴 때는 아래 기준으로 고릅니다.

- 사용자가 할 수 있는 일이 새로 생겼다면 `feat`
- 잘못 동작하던 것을 고쳤다면 `fix`
- 설명 문서만 바뀌었다면 `docs`
- 실행 결과는 같고 코드 구조만 좋아졌다면 `refactor`
- 설정, 의존성, Git 훅, 빌드 설정 변경이면 `chore`
- 속도를 개선했다면 `perf`

### 제목 작성 팁

좋은 예:

```text
fix(todo): reject blank title
docs: add pr checklist
chore: install git hooks via npm install
```

피해야 할 예:

```text
fix: 수정
feat: 작업함
chore: 이것저것 변경
```

제목에는 마침표를 붙이지 않습니다. 영어로 쓸 때는 `added`, `fixed` 같은
과거형보다 `add`, `fix`처럼 짧은 동사 형태를 권장합니다.

## 최신 main 반영하기

작업 도중 다른 팀원의 PR이 merge되면 내 브랜치가 오래된 상태가 될 수 있습니다.
이때는 최신 `main`을 내 브랜치에 반영합니다.

```bash
git status
git switch main
git pull
git switch feat/my-task
git merge main
```

충돌이 없다면 검증을 실행합니다.

```bash
npm run ci-check
```

충돌이 나면 Git이 알려주는 파일만 열어서 수정합니다.

```bash
git status
```

충돌 해결 후에는 아래 순서로 진행합니다.

```bash
git add path/to/conflicted-file.tsx
npm run ci-check
git commit
```

충돌 해결이 어렵다면 바로 팀원에게 공유합니다. 같은 파일을 여러 명이 수정하고
있다면 혼자 오래 해결하지 않는 것이 좋습니다.

## Push와 PR 만들기

커밋이 끝났다면 원격 브랜치로 push합니다.

```bash
git push -u origin feat/my-task
```

> push 직전에 `pre-push` 훅이 `npm run ci-check`(검사 + 타입검사 + 빌드)를
> 실행합니다. 시간이 조금 걸려도 정상입니다.

GitHub에서 PR을 만듭니다.

1. GitHub 저장소로 이동합니다.
2. `Pull requests` 탭을 클릭합니다.
3. `New pull request`를 클릭합니다.
4. `base`는 `main`, `compare`는 내 브랜치로 선택합니다.
5. 제목과 내용을 작성합니다. (PR 템플릿이 자동으로 채워집니다)
6. `Create pull request`를 클릭합니다.

PR 설명에는 아래를 채웁니다.

- `Summary`: 이 PR이 왜 필요한지 한두 줄로 작성합니다.
- `Changes`: 실제로 바꾼 내용을 목록으로 작성합니다.
- `Checklist`: 해당되는 항목을 체크합니다.
- `Test`: 실행한 검사와 수동 확인을 적습니다.
- `Notes`: 리뷰어가 알아야 할 점을 적습니다.

PR 크기는 작을수록 좋습니다. 리뷰어가 10분 안에 핵심을 이해할 수 있는 크기를
목표로 합니다.

## PR과 이슈 연결하기

PR은 코드 변경이고, 이슈는 해야 할 일입니다.
PR 설명에 이슈 번호를 적어두면 어떤 작업을 해결하는 PR인지 연결할 수 있습니다.

단순히 참고만 할 때:

```text
Related to #12
```

PR이 merge되면 이슈도 자동으로 닫고 싶을 때:

```text
Closes #12
```

GitHub는 PR 본문에 아래 키워드가 있으면 PR이 merge될 때 연결된 이슈를
자동으로 닫습니다.

- `Closes #12`
- `Fixes #12`
- `Resolves #12`

여러 이슈를 닫을 수도 있습니다.

```text
Closes #12
Closes #15
```

주의할 점:

- PR을 그냥 `Close pull request`로 닫으면 코드가 merge되지 않습니다.
- 이슈 자동 닫기는 보통 PR이 `main`에 merge될 때 동작합니다.
- 아직 해결하지 않은 이슈는 `Related to #번호`처럼 참고만 적습니다.

## PR 올리기 전 최종 체크리스트

- [ ] `git status`에서 예상한 변경만 보인다.
- [ ] `git diff --staged`로 커밋될 내용을 확인했다.
- [ ] 관련 없는 파일은 staging에서 뺐다.
- [ ] `.env`, `.env.local`, `node_modules/`, `dist/`가 포함되지 않았다.
- [ ] 환경 변수를 추가했다면 `.env.example`과 `vite-env.d.ts`도 업데이트했다.
- [ ] `npm run ci-check`를 실행했다.
- [ ] 실패한 검사가 있다면 수정했거나 PR에 이유를 적었다.
- [ ] PR 제목이 변경 내용을 잘 설명한다.
- [ ] PR 설명에 검사·점검 결과를 적었다.
- [ ] 관련 이슈가 있다면 `Closes #번호` 또는 `Related to #번호`를 적었다.

## 리뷰 받은 뒤

리뷰 코멘트를 받으면 아래 흐름을 따릅니다.

1. 코멘트를 읽고 의도를 이해합니다.
2. 필요한 파일만 수정합니다.
3. `git status`와 `git diff`로 변경 범위를 확인합니다.
4. `npm run ci-check`를 실행합니다.
5. 추가 커밋을 push합니다.
6. 리뷰 코멘트에 무엇을 반영했는지 답합니다.

리뷰 반영 커밋 예:

```text
fix: prevent empty todo save
docs: clarify timer reset behavior
```

## PR merge 후 브랜치 삭제하기

PR이 merge되면 작업 브랜치는 보통 더 이상 필요하지 않습니다.
GitHub PR 화면에 `Delete branch` 버튼이 보이면 눌러서 원격 브랜치를 삭제할 수
있습니다.

로컬 브랜치도 정리합니다.

```bash
git switch main
git pull
git branch -d feat/my-task
```

원격 브랜치를 터미널에서 삭제해야 할 때는 아래 명령어를 사용합니다.

```bash
git push origin --delete feat/my-task
```

브랜치 삭제 전 확인할 것:

- PR이 merge됐나요?
- 필요한 변경이 모두 `main`에 들어갔나요?
- 내 로컬에 커밋하지 않은 변경이 없나요?

```bash
git status
git branch
```

`git branch -d`가 실패한다면 아직 merge되지 않았을 수 있습니다. 이때 `-D`로
강제 삭제하지 말고 먼저 상황을 확인합니다.

## 자주 하는 실수

### main에서 바로 작업하기

작업 전에는 항상 브랜치를 확인합니다.

```bash
git branch
```

`main`에 있다면 새 브랜치를 만듭니다.

```bash
git switch -c feat/my-task
```

### 너무 많은 파일을 한 번에 커밋하기

커밋 전에는 꼭 확인합니다.

```bash
git status
git diff --staged
```

이번 작업과 상관없는 파일은 staging에서 뺍니다.

```bash
git restore --staged path/to/file.tsx
```

### PR을 close하면 이슈도 닫힌다고 생각하기

PR을 close하는 것은 "이 PR은 merge하지 않겠다"는 뜻입니다.
이슈를 닫는 것과는 다릅니다.

이슈를 해결했다면 보통 아래 둘 중 하나를 사용합니다.

- PR 본문에 `Closes #번호`를 적고 merge합니다.
- GitHub 이슈 화면에서 직접 `Close issue`를 누릅니다.

### 위험한 명령어를 급하게 쓰기

아래 명령어는 특별히 요청받은 경우가 아니면 사용하지 않습니다.

```bash
git reset --hard
git push --force
git branch -D branch-name
```

## 막혔을 때 공유할 정보

Git 문제로 막혔다면 아래 정보를 팀원에게 공유합니다.

```bash
git status
git branch
git log --oneline -5
```

그리고 아래 내용을 같이 적습니다.

- 어떤 브랜치에서 작업 중인지
- 어떤 명령어를 실행했는지
- 어떤 에러 메시지가 나왔는지
- 어떤 파일에서 충돌이 났는지

좋은 질문 예:

```text
feat/todo-ai-button 브랜치에서 git merge main을 했더니
src/main.tsx 파일에 충돌이 났습니다.
git status 결과는 아래와 같습니다.
...
제가 수정한 부분은 AI 버튼 핸들러이고, main에서는 같은 컴포넌트 구조가
바뀐 것 같습니다.
```

이렇게 공유하면 팀원이 상황을 훨씬 빨리 이해할 수 있습니다.
