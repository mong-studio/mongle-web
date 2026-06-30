# Frontend API Flow

이 문서는 현재 `mongle-web` 프론트엔드가 백엔드 API를 호출하는 방식을 코드 기준으로 정리한다.

## 공통 HTTP 클라이언트

- 공통 클라이언트는 `src/shared/api/client.ts`의 `apiClient`를 사용한다.
- `apiClient`의 `baseURL`은 `/api/v1`이다.
- feature API 함수에서는 `/todos/chat/`처럼 `/api/v1` 이후 경로만 넘긴다.
- 실제 호출 URL 예시는 `/api/v1/todos/chat/`, `/api/v1/auth/login`이다.
- 요청에는 기본 헤더 `X-Client-Type: react`, `X-Client-Version: __APP_VERSION__`가 붙는다.
- `withCredentials: true`로 쿠키를 포함한다.

```ts
export const apiClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: {
    "X-Client-Type": "react",
    "X-Client-Version": __APP_VERSION__,
  },
});
```

## 인증 처리

- 인증 상태는 `src/features/auth/store.ts`의 Zustand store가 관리한다.
- 로그인 성공 시 access token을 `sessionStorage`의 `mongle_access`에 저장한다.
- `configureAuthClient`로 `apiClient`에 인증 핸들러를 주입한다.
- 요청 인터셉터는 access token이 있으면 `Authorization: Bearer <token>`을 붙인다.
- 응답이 `401`이면 로그인/refresh/logout 요청을 제외하고 refresh를 한 번 시도한 뒤 원 요청을 재시도한다.
- 동시에 여러 요청이 `401`을 받아도 refresh는 `refreshPromise` 하나를 공유한다.
- refresh 실패 시 `onSessionExpired`가 로컬 세션을 비운다.

## 환경 변수 사용

- API 호출 자체는 `apiClient.baseURL = "/api/v1"`을 따른다.
- `VITE_API_BASE`는 `src/app/App.tsx`에서 이미지 등 상대 URL을 화면용 절대/프록시 URL로 보정할 때 사용한다.
- 따라서 일반 API 함수에서 `VITE_API_BASE`를 직접 붙이지 않는다.

## 응답 래핑 처리

일부 AI 관련 엔드포인트는 일반 응답과 envelope 응답을 모두 허용한다.

- 일반 응답: `{ kind: "candidates", ... }`
- envelope 응답: `{ status: "done", result: {...}, error: null }`
- 비동기 job 응답: `{ status: "pending", result: { job_id }, error: null }`

`todoApi.ts`, `plannerApi.ts`는 `unwrapApiResult`로 envelope를 풀어 사용한다. 플래너 chat은 `pending`이면 job 조회 API를 폴링하고, `done`이면 결과를 화면 모델로 변환한다.

## 주요 도메인별 API

### Auth

파일: `src/features/auth/api.ts`

| 동작 | 메서드 | 프론트 경로 | 실제 URL |
| --- | --- | --- | --- |
| 로그인 | POST | `/auth/login` | `/api/v1/auth/login` |
| 토큰 refresh | POST | `/auth/token/refresh` | `/api/v1/auth/token/refresh` |
| 로그아웃 | POST | `/auth/logout` | `/api/v1/auth/logout` |
| 내 정보 조회 | GET | `/auth/me/` | `/api/v1/auth/me/` |
| 이메일 인증 요청 | POST | `/auth/email-verification` | `/api/v1/auth/email-verification` |
| 이메일 인증 확인 | POST | `/auth/email-verification/confirm` | `/api/v1/auth/email-verification/confirm` |
| 회원가입 | POST | `/auth/signup` | `/api/v1/auth/signup` |
| 비밀번호 재설정 | POST | `/auth/password-reset` | `/api/v1/auth/password-reset` |

### Planner Chat

파일: `src/features/planner-chat/plannerApi.ts`

| 동작 | 메서드 | 프론트 경로 | 실제 URL |
| --- | --- | --- | --- |
| 멀티턴 대화 job 생성 | POST | `/todos/chat/` | `/api/v1/todos/chat/` |
| 멀티턴 대화 job 조회 | GET | `/todos/chat/{jobId}/` | `/api/v1/todos/chat/{jobId}/` |
| 생성 플랜 확정 저장 | POST | `/todos/planner-confirm/` | `/api/v1/todos/planner-confirm/` |

`/todos/planner-confirm/`은 플래너 챗봇에서 사용자가 `계획 저장`을 눌렀을 때 호출하는 로그인 사용자용 저장 API다. 요청에는 일반 인증 헤더만 사용하고, 백엔드는 현재 로그인 사용자를 기준으로 TODO와 일정을 저장한다. `/todos/commit/`은 AI 내부 commit 계약을 위해 남겨두며 브라우저에서 직접 호출하지 않는다.

플래너 흐름:

1. 사용자가 메시지를 입력한다.
2. 프론트가 `/todos/chat/`에 `{ message, thread_id }`를 보낸다.
3. 응답이 `pending`이면 `/todos/chat/{jobId}/`를 2초 간격으로 최대 6분 폴링한다.
4. 최종 응답이 `follow_up`이면 질문 말풍선을 추가하고 같은 `thread_id`로 대화를 이어간다.
5. 최종 응답이 `candidates`이면 `todos`와 `calendar_events`를 좌측 생성된 플랜 영역에 표시한다.
6. 사용자가 `계획 저장`을 누르면 생성 결과 전체를 `/todos/planner-confirm/`으로 보낸다.
7. 저장 응답의 `todos`만 오늘의 할일 HUD에 반영하고, `calendar_events.length`는 일정 저장 개수로 전달한다.

현재 payload 형태:

```ts
type PlannerSavePayload = {
  todos: { title: string; due_date: string; tags?: string[] }[];
  calendar_events: { title: string; due_date: string; tags?: string[] }[];
};
```

### Todo

파일: `src/features/todo/todoApi.ts`

| 동작 | 메서드 | 프론트 경로 | 실제 URL |
| --- | --- | --- | --- |
| 싱글턴 후보 생성 | POST | `/todos/generate/` | `/api/v1/todos/generate/` |
| 싱글턴 확정 저장 | POST | `/todos/confirm/` | `/api/v1/todos/confirm/` |
| 단일 TODO 즉시 생성 | POST | `/todos/` | `/api/v1/todos/` |
| 퀘스트 미리보기 | POST | `/todos/quest-preview/` | `/api/v1/todos/quest-preview/` |
| TODO 완료 | PATCH | `/todos/{todoId}/complete/` | `/api/v1/todos/{todoId}/complete/` |

현재 구분:

- 일반 TODO 생성 UI는 `/todos/generate/` 후 `/todos/confirm/`을 사용한다.
- 플래너 챗봇 멀티턴 결과는 `/todos/chat/` 후 로그인 사용자용 저장 API인 `/todos/planner-confirm/`을 사용한다.
- LLM/퀘스트 없이 바로 저장하는 경우는 `/todos/`를 사용한다.

### Character

파일: `src/features/character/api.ts`

캐릭터 생성은 비동기 job 파이프라인으로 처리한다.

| 단계 | 메서드 | 프론트 경로 | 설명 |
| --- | --- | --- | --- |
| 소스 이미지 presign | POST | `/characters/source-images/` | 선택 이미지 업로드 URL 발급 |
| S3 직접 업로드 | PUT | presigned URL | `apiClient`가 아니라 `fetch` 사용 |
| 생성 job 등록 | POST | `/characters/generation-jobs/` | AI 생성 job 생성 |
| job 상태 폴링 | GET | `/characters/generation-jobs/{jobId}/` | 2초 간격, 최대 6분 |
| 캐릭터 등록 | POST | `/characters/` | 성공한 job을 캐릭터로 저장 |
| 캐릭터 목록 | GET | `/characters/` | 현재 사용자 캐릭터 목록 |

새로고침/이탈 대비:

- job 등록 직후 `pendingJob`을 저장한다.
- 재진입 시 `resumePendingCharacter`가 job 상태를 다시 확인한다.
- `SUCCEEDED`이면 등록을 마무리하고, `TIMEOUT`이면 pending 상태를 유지한다.

### Calendar

파일: `src/features/calendar/CalendarModal.tsx`

| 동작 | 메서드 | 프론트 경로 |
| --- | --- | --- |
| 월간 캘린더 조회 | GET | `/calendar/?year=YYYY&month=M` |
| TODO 생성 | POST | `/todos/` |
| 일정 생성 | POST | `/schedules/` |
| TODO 수정 | PATCH | `/todos/{todoId}/` |
| 일정 수정 | PATCH | `/schedules/{scheduleId}/` |
| TODO 삭제 | DELETE | `/todos/{todoId}/` |
| 일정 삭제 | DELETE | `/schedules/{scheduleId}/` |
| TODO 실패 처리 | PATCH | `/todos/{todoId}/fail/` |

캘린더는 조회 결과의 `todos`, `schedules`를 화면 이벤트로 합쳐서 표시한다.

### Tags

파일: `src/shared/tags/useTags.ts`

| 동작 | 메서드 | 프론트 경로 |
| --- | --- | --- |
| 태그 목록 | GET | `/tags/` |
| 태그 생성 | POST | `/tags/` |
| 태그 수정 | PATCH | `/tags/{id}/` |
| 태그 삭제 | DELETE | `/tags/{id}/` |

태그 API는 calendar와 todo에서 공유한다.

### Feed

파일: `src/features/feed/api.ts`

| 동작 | 메서드 | 프론트 경로 |
| --- | --- | --- |
| 게시글 목록 | GET | `/posts/` |
| 게시글 상세 | GET | `/posts/{postId}/` |
| 댓글 작성 | POST | `/posts/{postId}/comments/` |
| 캐릭터 목록 | GET | `/characters/` |
| 캐릭터 상세 | GET | `/characters/{characterId}/` |

### Reflection

파일: `src/features/reflection/api.ts`

| 동작 | 메서드 | 프론트 경로 |
| --- | --- | --- |
| 이전 회고 목록 | GET | `/reflections/?before={date}` |
| 회고 컨텍스트 조회 | GET | `/reflections/context/{date}/` |
| 날짜별 회고 조회 | GET | `/reflections/{date}/` |
| 회고 생성 | POST | `/reflections/` |
| 회고 수정 | PATCH | `/reflections/{reflectionId}/` |

### My Page

파일: `src/features/my-page/MyPageWrapper.tsx`

| 동작 | 메서드 | 프론트 경로 |
| --- | --- | --- |
| 회원 탈퇴 | DELETE | `/auth/me/` |
| 프로필 수정 | PATCH | `/auth/me/` |
| 비밀번호 변경 | POST | `/auth/change-password/` |

## 예외적인 fetch 사용

일반 백엔드 API는 `apiClient`를 사용한다. 예외는 다음과 같다.

- `src/features/character/api.ts`: presigned URL에 이미지 파일을 직접 `PUT` 업로드할 때 `fetch` 사용
- `src/features/village/PhaserVillage.tsx`: Tiled map/json/image 같은 정적 에셋 로딩에 `fetch` 사용

## 현재 플래너 관련 주의점

- 프론트의 플래너 챗봇은 `/todos/chat/`과 `/todos/planner-confirm/`만 사용한다.
- `/todos/commit/`은 AI 내부 commit API와 이름이 겹치므로 프론트에서 직접 호출하지 않는다.
- 프론트 코드에 적힌 경로는 `/api/v1`을 제외한 상대 경로다.
- 실제 호출 URL은 `apiClient.baseURL` 때문에 `/api/v1/todos/chat/`, `/api/v1/todos/planner-confirm/`이 된다.
- `/todos/confirm/`은 아직 일반 TODO 싱글턴 확정 저장에서 사용 중이므로 바로 제거하면 안 된다.
