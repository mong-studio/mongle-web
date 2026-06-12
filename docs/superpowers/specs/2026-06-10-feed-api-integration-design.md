# Feed API Integration Design

**Date:** 2026-06-10
**Status:** Approved

## Goal

Replace all hardcoded mock data in the feed UI (`feedData.ts` POSTS / MONGSIL_POSTS) with real server API calls, using TDD.

## Scope

### In scope
- `feed/api.ts` — typed API client for all 3 feed endpoints
- `feed/api.test.ts` — vitest tests written before implementation
- Update `FeedModal.tsx`, `ProfileScreen.tsx`, `PostScreen.tsx` to use real data
- Comment input UI in `PostScreen.tsx` (input + button, API wiring is TODO)

### Out of scope
- Multi-user friend feed (future)
- Actual comment submit API wiring
- Like toggle server sync

---

## Server Endpoints

Base: `/api/v1/`

| Method | Path | Returns |
|--------|------|---------|
| GET | `posts/` | `ApiPost[]` — all posts owned by the logged-in user's characters |
| GET | `posts/<uuid>/` | `ApiPost` — post detail with comments |
| POST | `posts/<uuid>/comments/` | `ApiComment` — created comment (201) |

---

## Data Types

```typescript
export interface ApiComment {
  comment_id: string
  user: string
  content: string
  created_at: string
}

export interface ApiPost {
  post_id: string
  character: string   // character PK
  quest_id: string
  img_url: string
  content: string
  is_liked: boolean
  comments: ApiComment[]
  created_at: string
}
```

---

## Architecture

### Data flow

```
FeedModal (fetches posts once)
  ├── FeedPost list (renders ApiPost[])
  ├── ProfileScreen (receives posts: ApiPost[], filters by character)
  └── PostScreen (fetches own detail via fetchPostDetail(postId))
```

### New file: `feed/api.ts`

Follows the same pattern as `auth/api.ts` — uses `apiClient` from `auth/client.ts`.

```typescript
export async function fetchPosts(): Promise<ApiPost[]>
export async function fetchPostDetail(postId: string): Promise<ApiPost>
export async function createComment(postId: string, content: string): Promise<ApiComment>
```

---

## Testing Plan (`feed/api.test.ts`)

Uses vitest + axios adapter mock (same pattern as `auth/client.test.ts`).

| Test | Assertion |
|------|-----------|
| `fetchPosts` success | Returns `ApiPost[]`, sends `Authorization` header |
| `fetchPosts` empty | Returns `[]` without error |
| `fetchPostDetail` success | Returns single `ApiPost` with `comments` array |
| `fetchPostDetail` 404 | Throws error |
| `createComment` success | Returns `ApiComment`, status 201 |

---

## Component Changes

### `FeedModal.tsx`
- Add `useState<ApiPost[]>` + loading + error states
- `useEffect` → calls `fetchPosts()` on mount
- Remove `POSTS` import from `feedData.ts`
- Add `selectedCharacterId: string | null` state alongside `selectedPostId`
- `onAuthorClick`: instead of hardcoded `p.id === "mongsil"` check, set `selectedCharacterId = post.character` for all posts
- Pass `posts` and `selectedCharacterId` down to `ProfileScreen` as props

### `ProfileScreen.tsx`
- New props: `posts: ApiPost[]`, `characterId: string`
- Remove `MONGSIL_POSTS` import
- Filter `posts` by `post.character === characterId` to display that character's posts
- Stats (hearts, post count) computed from filtered posts

### `PostScreen.tsx`
- Keep `postId: string` prop
- Add `useState<ApiPost | null>` + loading state
- `useEffect` → calls `fetchPostDetail(postId)` on mount
- Remove `MONGSIL_POSTS` import
- Comment input: replace placeholder `<div>` with `<input>` + `<button>` (TODO: wire `createComment`)

---

## TDD Execution Order

1. Write `feed/api.test.ts` → run `npm test` → confirm RED
2. Implement `feed/api.ts` → run `npm test` → confirm GREEN
3. Update `FeedModal.tsx`
4. Update `ProfileScreen.tsx`
5. Update `PostScreen.tsx`
