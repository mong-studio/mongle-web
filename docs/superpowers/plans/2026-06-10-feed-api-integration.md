# Feed API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded mock feed data (`POSTS`, `MONGSIL_POSTS`) with real server API calls using TDD.

**Architecture:** New `feed/api.ts` provides typed fetch functions and a `toFeedPost` adapter mapping `ApiPost` → `FeedPostData`; `FeedModal` fetches posts+characters on mount and passes real data down; `PostScreen` fetches its own detail internally; `ProfileScreen` receives posts+character from parent and fetches character detail internally for persona/bio.

**Tech Stack:** TypeScript, React 18, Vite, Vitest, Axios (`apiClient` from `auth/client.ts`), Django REST Framework

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| CREATE | `apps/game/src/feed/api.ts` | Types, fetch functions, `toFeedPost` adapter |
| CREATE | `apps/game/src/feed/api.test.ts` | Vitest tests for all 3 endpoints |
| MODIFY | `apps/game/src/feed/FeedModal.tsx` | Fetch posts+characters on mount, replace POSTS mock |
| MODIFY | `apps/game/src/feed/ProfileScreen.tsx` | Accept `posts: ApiPost[]` + `characterId`, fetch character detail |
| MODIFY | `apps/game/src/feed/PostScreen.tsx` | Fetch post detail, add comment input UI |

---

## Known Limitations (by design, not bugs)

- Server `Post` model has no like count field — `likes` will be `0` in adapter, local toggle only
- `tags` not in server model — shown as `[]`
- `place` not in server model — shown as `""`
- `quest_id` (UUID) shown as quest value instead of quest text — full quest fetch is out of scope
- Like toggle not synced to server (out of scope per spec)

---

## Task 1: `feed/api.ts` — types, fetch functions, adapter

**Files:**
- Create: `apps/game/src/feed/api.test.ts`
- Create: `apps/game/src/feed/api.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/game/src/feed/api.test.ts`:

```typescript
import type { InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import { apiClient, configureAuthClient } from "../auth/client.js";
import { createComment, fetchPostDetail, fetchPosts } from "./api.js";

type AdapterHandler = (config: InternalAxiosRequestConfig) => {
  status: number;
  data: unknown;
};

function useAdapter(handler: AdapterHandler) {
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const { status, data } = handler(config as InternalAxiosRequestConfig);
    return {
      data,
      status,
      statusText: String(status),
      headers: {},
      config: config as InternalAxiosRequestConfig,
    };
  };
}

describe("feed API", () => {
  beforeEach(() => {
    configureAuthClient({
      getAccessToken: () => "test-token",
      refreshSession: async () => false,
      onSessionExpired: () => {},
    });
  });

  describe("fetchPosts", () => {
    it("GET /posts/ 로 포스트 목록을 반환한다", async () => {
      const mockPosts = [
        {
          post_id: "aaa",
          character: "char-1",
          quest_id: "q-1",
          img_url: "https://example.com/img.png",
          content: "테스트 내용",
          is_liked: false,
          comments: [],
          created_at: "2026-06-10T10:00:00Z",
        },
      ];
      let capturedUrl: string | undefined;
      useAdapter((config) => {
        capturedUrl = config.url;
        return { status: 200, data: mockPosts };
      });

      const result = await fetchPosts();

      expect(capturedUrl).toBe("/posts/");
      expect(result).toEqual(mockPosts);
    });

    it("빈 배열도 정상 처리한다", async () => {
      useAdapter(() => ({ status: 200, data: [] }));
      const result = await fetchPosts();
      expect(result).toEqual([]);
    });
  });

  describe("fetchPostDetail", () => {
    it("GET /posts/<id>/ 로 단일 포스트와 댓글을 반환한다", async () => {
      const mockPost = {
        post_id: "bbb",
        character: "char-1",
        quest_id: "q-1",
        img_url: "",
        content: "상세 내용",
        is_liked: true,
        comments: [
          {
            comment_id: "c-1",
            user: "user-1",
            content: "댓글",
            created_at: "2026-06-10T11:00:00Z",
          },
        ],
        created_at: "2026-06-10T10:00:00Z",
      };
      let capturedUrl: string | undefined;
      useAdapter((config) => {
        capturedUrl = config.url;
        return { status: 200, data: mockPost };
      });

      const result = await fetchPostDetail("bbb");

      expect(capturedUrl).toBe("/posts/bbb/");
      expect(result.post_id).toBe("bbb");
      expect(result.comments).toHaveLength(1);
    });

    it("404면 에러를 던진다", async () => {
      useAdapter(() => ({ status: 404, data: {} }));
      await expect(fetchPostDetail("nonexistent")).rejects.toThrow();
    });
  });

  describe("createComment", () => {
    it("POST /posts/<id>/comments/ 로 댓글을 생성한다", async () => {
      const mockComment = {
        comment_id: "c-new",
        user: "user-1",
        content: "새 댓글",
        created_at: "2026-06-10T12:00:00Z",
      };
      let capturedUrl: string | undefined;
      let capturedBody: unknown;
      useAdapter((config) => {
        capturedUrl = config.url;
        capturedBody = JSON.parse(config.data as string);
        return { status: 201, data: mockComment };
      });

      const result = await createComment("bbb", "새 댓글");

      expect(capturedUrl).toBe("/posts/bbb/comments/");
      expect(capturedBody).toEqual({ content: "새 댓글" });
      expect(result.comment_id).toBe("c-new");
    });
  });
});
```

- [ ] **Step 2: Run tests — confirm RED**

```bash
cd /Users/jpaper/Documents/projects/mong-studio/mongle-web/apps/game && npm test -- --reporter=verbose 2>&1 | head -30
```

Expected: FAIL — `Cannot find module './api.js'`

- [ ] **Step 3: Implement `feed/api.ts`**

Create `apps/game/src/feed/api.ts`:

```typescript
import { apiClient } from "../auth/client.js";
import type { FeedComment, FeedPostData } from "./feedData.js";

export interface ApiComment {
  comment_id: string;
  user: string;
  content: string;
  created_at: string;
}

export interface ApiPost {
  post_id: string;
  character: string;
  quest_id: string;
  img_url: string;
  content: string;
  is_liked: boolean;
  comments: ApiComment[];
  created_at: string;
}

export interface ApiCharacter {
  character_id: string;
  name: string;
  gen_img_url: string;
  active_quest_count: number;
}

export interface ApiCharacterDetail {
  character_id: string;
  name: string;
  gen_img_url: string;
  persona: string;
  is_active: boolean;
  created_at: string;
  active_quests: { quest_id: string; todo_id: string; title: string }[];
}

export async function fetchPosts(): Promise<ApiPost[]> {
  const { data } = await apiClient.get<ApiPost[]>("/posts/");
  return data;
}

export async function fetchPostDetail(postId: string): Promise<ApiPost> {
  const { data } = await apiClient.get<ApiPost>(`/posts/${postId}/`);
  return data;
}

export async function createComment(postId: string, content: string): Promise<ApiComment> {
  const { data } = await apiClient.post<ApiComment>(`/posts/${postId}/comments/`, { content });
  return data;
}

export async function fetchCharacters(): Promise<ApiCharacter[]> {
  const { data } = await apiClient.get<ApiCharacter[]>("/characters/");
  return data;
}

export async function fetchCharacterDetail(characterId: string): Promise<ApiCharacterDetail> {
  const { data } = await apiClient.get<ApiCharacterDetail>(`/characters/${characterId}/`);
  return data;
}

export function toFeedPost(
  post: ApiPost,
  charMap: Map<string, ApiCharacter>,
): FeedPostData {
  const char = charMap.get(post.character);
  const commentList: FeedComment[] = post.comments.map((c) => ({
    who: c.user,
    txt: c.content,
  }));
  return {
    id: post.post_id,
    name: char?.name ?? "캐릭터",
    role: "",
    time: formatRelativeTime(post.created_at),
    place: "",
    tint: "#F4DBC6",
    caption: [post.content],
    quest: { label: "퀘스트", value: post.quest_id },
    tags: [],
    likes: 0,
    comments: post.comments.length,
    heroPlaceholder: post.img_url || "이미지",
    commentList,
  };
}

function formatRelativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(isoStr).toLocaleDateString("ko-KR");
}
```

- [ ] **Step 4: Run tests — confirm GREEN**

```bash
cd /Users/jpaper/Documents/projects/mong-studio/mongle-web/apps/game && npm test -- --reporter=verbose 2>&1 | head -30
```

Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git -C /Users/jpaper/Documents/projects/mong-studio/mongle-web add apps/game/src/feed/api.ts apps/game/src/feed/api.test.ts
git -C /Users/jpaper/Documents/projects/mong-studio/mongle-web commit -m "feat: feed API client with types, fetch functions, and toFeedPost adapter"
```

---

## Task 2: `FeedModal.tsx` — fetch posts + characters on mount

**Files:**
- Modify: `apps/game/src/feed/FeedModal.tsx`

- [ ] **Step 1: Update imports**

In `FeedModal.tsx`, change the `feedData.js` import from:
```typescript
import { MONGSIL_POSTS, POSTS, THEMES, type ThemeTokens } from "./feedData.js";
```
to:
```typescript
import { THEMES, type ThemeTokens } from "./feedData.js";
```

Add a new import after existing imports:
```typescript
import {
  type ApiCharacter,
  type ApiPost,
  fetchCharacters,
  fetchPosts,
  toFeedPost,
} from "./api.js";
```

- [ ] **Step 2: Replace state**

Inside the `FeedModal` function body, remove:
```typescript
const [mongsilLikes, setMongsilLikes] = useState<
  Record<string, { count: number; liked: boolean }>
>(() => Object.fromEntries(MONGSIL_POSTS.map((p) => [p.id, { count: p.hearts, liked: false }])));
```

And the entire `toggleMongsilLike` function:
```typescript
function toggleMongsilLike(id: string) { ... }
```

Add in their place:
```typescript
const [apiPosts, setApiPosts] = useState<ApiPost[]>([]);
const [charMap, setCharMap] = useState<Map<string, ApiCharacter>>(new Map());
const [feedLoading, setFeedLoading] = useState(true);
const [feedError, setFeedError] = useState<string | null>(null);
const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
```

- [ ] **Step 3: Add fetch effect**

After the existing `useEffect` (the one that resets navScreen on tab change), add:

```typescript
useEffect(() => {
  let cancelled = false;
  async function load() {
    try {
      const [posts, chars] = await Promise.all([fetchPosts(), fetchCharacters()]);
      if (cancelled) return;
      const map = new Map(chars.map((c) => [c.character_id, c]));
      setApiPosts(posts);
      setCharMap(map);
    } catch {
      if (!cancelled) setFeedError("피드를 불러오지 못했어요.");
    } finally {
      if (!cancelled) setFeedLoading(false);
    }
  }
  load();
  return () => {
    cancelled = true;
  };
}, []);
```

- [ ] **Step 4: Replace feed list rendering**

Find the `<div className="feed">` block and replace it with:

```tsx
<div className="feed">
  {feedLoading && (
    <div style={{ padding: 32, textAlign: "center", color: th.inkSoft }}>
      불러오는 중...
    </div>
  )}
  {feedError && (
    <div style={{ padding: 32, textAlign: "center", color: th.like }}>
      {feedError}
    </div>
  )}
  {!feedLoading &&
    !feedError &&
    apiPosts.map((p) => (
      <FeedPost
        key={p.post_id}
        post={toFeedPost(p, charMap)}
        th={th}
        pixelMode={false}
        notify={notify}
        onAuthorClick={() => {
          setSelectedCharacterId(p.character);
          setNavScreen("profile");
        }}
      />
    ))}
  {!feedLoading && !feedError && apiPosts.length === 0 && (
    <div style={{ padding: 32, textAlign: "center", color: th.inkSoft }}>
      아직 게시글이 없어요 🌱
    </div>
  )}
</div>
```

- [ ] **Step 5: Update header subtitle**

Change:
```tsx
친구들의 따뜻한 소식 {POSTS.length}개
```
to:
```tsx
친구들의 따뜻한 소식 {apiPosts.length}개
```

- [ ] **Step 6: Update ProfileScreen usage**

Find:
```tsx
{navScreen === "profile" && (
  <ProfileScreen
    th={th}
    onBack={() => setNavScreen("feed")}
    onOpenPost={(id) => {
      setSelectedPostId(id);
      setNavScreen("post");
    }}
    likes={mongsilLikes}
  />
)}
```

Replace with:
```tsx
{navScreen === "profile" && selectedCharacterId && (
  <ProfileScreen
    th={th}
    onBack={() => setNavScreen("feed")}
    onOpenPost={(id) => {
      setSelectedPostId(id);
      setNavScreen("post");
    }}
    posts={apiPosts}
    characterId={selectedCharacterId}
  />
)}
```

- [ ] **Step 7: Update PostScreen usage**

Find:
```tsx
{navScreen === "post" && selectedPostId && (
  <PostScreen
    postId={selectedPostId}
    th={th}
    likes={mongsilLikes}
    onToggleLike={toggleMongsilLike}
    onBack={() => setNavScreen("profile")}
    onOpenProfile={() => setNavScreen("profile")}
  />
)}
```

Replace with:
```tsx
{navScreen === "post" && selectedPostId && (
  <PostScreen
    postId={selectedPostId}
    th={th}
    onBack={() => setNavScreen("profile")}
    onOpenProfile={() => setNavScreen("profile")}
  />
)}
```

- [ ] **Step 8: TypeScript check**

```bash
cd /Users/jpaper/Documents/projects/mong-studio/mongle-web/apps/game && npx tsc --noEmit 2>&1
```

Expected: no errors. Fix any type errors before proceeding.

- [ ] **Step 9: Commit**

```bash
git -C /Users/jpaper/Documents/projects/mong-studio/mongle-web add apps/game/src/feed/FeedModal.tsx
git -C /Users/jpaper/Documents/projects/mong-studio/mongle-web commit -m "feat: FeedModal fetches posts and characters from API"
```

---

## Task 3: `ProfileScreen.tsx` — real posts + character detail

**Files:**
- Modify: `apps/game/src/feed/ProfileScreen.tsx`

- [ ] **Step 1: Replace entire ProfileScreen**

Completely replace `apps/game/src/feed/ProfileScreen.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { type ApiCharacterDetail, type ApiPost, fetchCharacterDetail } from "./api.js";
import type { ThemeTokens } from "./feedData.js";
import { ImageSlot } from "./ImageSlot.js";

interface ProfileScreenProps {
  th: ThemeTokens;
  onBack: () => void;
  onOpenPost: (id: string) => void;
  posts: ApiPost[];
  characterId: string;
}

export function ProfileScreen({
  th,
  onBack,
  onOpenPost,
  posts,
  characterId,
}: ProfileScreenProps) {
  const [following, setFollowing] = useState(false);
  const [character, setCharacter] = useState<ApiCharacterDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCharacterDetail(characterId)
      .then((c) => {
        if (!cancelled) setCharacter(c);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [characterId]);

  const characterPosts = posts.filter((p) => p.character === characterId);

  return (
    <div className="pf-screen" style={{ background: th.modalBg }}>
      <div className="pf-topbar" style={{ background: th.modalBg, borderColor: th.modalEdge }}>
        <button
          type="button"
          className="pf-iconbtn"
          style={{ color: th.ink }}
          onClick={onBack}
          aria-label="뒤로"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <div className="pf-topbar-center">
          <div className="pf-topbar-name" style={{ color: th.ink }}>
            {character?.name ?? "..."}
          </div>
          <div className="pf-topbar-sub" style={{ color: th.inkSoft }}>
            @{characterId.slice(0, 8)}
          </div>
        </div>
        <button
          type="button"
          className="pf-iconbtn"
          style={{ color: th.inkSoft }}
          aria-label="더보기"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="19" cy="12" r="1.7" />
          </svg>
        </button>
      </div>

      <div className="pf-scroll">
        <div className="pf-head">
          <div
            className="pf-avatar"
            style={{ boxShadow: `0 0 0 2.5px ${th.modalBg}, 0 0 0 4.5px ${th.accent}` }}
          >
            {character?.name?.[0] ?? "?"}
          </div>
          <div className="pf-stats">
            {(
              [
                ["게시물", characterPosts.length],
                ["이웃", 0],
              ] as const
            ).map(([label, val]) => (
              <div key={label} className="pf-stat">
                <div className="pf-stat-val" style={{ color: th.ink }}>
                  {val}
                </div>
                <div className="pf-stat-label" style={{ color: th.inkSoft }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pf-id">
          <span className="pf-name" style={{ color: th.ink }}>
            {character?.name ?? "..."}
          </span>
          {character?.persona && (
            <span className="pf-badge" style={{ background: th.badgeBg, color: th.badgeInk }}>
              {character.persona}
            </span>
          )}
        </div>

        <div className="pf-actions">
          <button
            type="button"
            className={`pf-btn${following ? " pf-btn-ghost" : ""}`}
            style={
              following
                ? { borderColor: th.modalEdge, color: th.ink }
                : {
                    background: th.accent,
                    color: th.accentInk,
                    boxShadow: `0 3px 0 ${th.badgeInk}`,
                  }
            }
            onClick={() => setFollowing((f) => !f)}
          >
            {following ? "✓ 이웃" : "+ 이웃 맺기"}
          </button>
        </div>

        <div className="pf-grid-wrap" style={{ borderColor: th.modalEdge }}>
          {characterPosts.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: th.inkSoft }}>
              아직 게시글이 없어요 🌱
            </div>
          )}
          <div className="pf-grid">
            {characterPosts.map((p) => (
              <button
                key={p.post_id}
                type="button"
                className="pf-grid-item"
                style={{ background: th.rowBg }}
                onClick={() => onOpenPost(p.post_id)}
              >
                <div className="pf-grid-img">
                  <ImageSlot
                    id={`pf-${p.post_id}`}
                    placeholder={p.img_url || "이미지"}
                    width="100%"
                    height={130}
                    tint={th.rowBg}
                    radius={5}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/jpaper/Documents/projects/mong-studio/mongle-web/apps/game && npx tsc --noEmit 2>&1
```

Expected: no errors. Fix any type errors before proceeding.

- [ ] **Step 3: Commit**

```bash
git -C /Users/jpaper/Documents/projects/mong-studio/mongle-web add apps/game/src/feed/ProfileScreen.tsx
git -C /Users/jpaper/Documents/projects/mong-studio/mongle-web commit -m "feat: ProfileScreen uses real character detail and post data from API"
```

---

## Task 4: `PostScreen.tsx` — fetch post detail + comment input UI

**Files:**
- Modify: `apps/game/src/feed/PostScreen.tsx`

- [ ] **Step 1: Replace entire PostScreen**

Completely replace `apps/game/src/feed/PostScreen.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { type ApiPost, fetchPostDetail } from "./api.js";
import type { ThemeTokens } from "./feedData.js";
import { ImageSlot } from "./ImageSlot.js";

interface PostScreenProps {
  postId: string;
  th: ThemeTokens;
  onBack: () => void;
  onOpenProfile: () => void;
}

export function PostScreen({ postId, th, onBack, onOpenProfile }: PostScreenProps) {
  const [post, setPost] = useState<ApiPost | null>(null);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchPostDetail(postId)
      .then((p) => {
        if (cancelled) return;
        setPost(p);
        setLiked(p.is_liked);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [postId]);

  if (!post) {
    return (
      <div className="pd-screen" style={{ background: th.modalBg }}>
        <div style={{ padding: 48, textAlign: "center", color: th.inkSoft }}>
          불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="pd-screen" style={{ background: th.modalBg }}>
      <div className="pd-topbar" style={{ background: th.modalBg, borderColor: th.modalEdge }}>
        <button
          type="button"
          className="pd-iconbtn"
          style={{ color: th.ink }}
          onClick={onBack}
          aria-label="뒤로"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5 8 12l7 7" />
          </svg>
        </button>
        <span className="pd-topbar-title" style={{ color: th.ink }}>
          게시물
        </span>
        <button
          type="button"
          className="pd-iconbtn"
          style={{ color: th.inkSoft }}
          aria-label="더보기"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="19" cy="12" r="1.7" />
          </svg>
        </button>
      </div>

      <div className="pd-scroll">
        <article className="pd-post" style={{ background: th.cardBg, borderColor: th.cardEdge }}>
          <button type="button" className="pd-author" onClick={onOpenProfile}>
            <div className="pd-avatar">{post.character[0]?.toUpperCase() ?? "?"}</div>
            <div className="pd-author-txt">
              <div className="pd-author-name" style={{ color: th.ink }}>
                {post.character.slice(0, 8)}
              </div>
              <div className="pd-author-meta" style={{ color: th.inkSoft }}>
                {new Date(post.created_at).toLocaleDateString("ko-KR")}
              </div>
            </div>
          </button>

          <div className="pd-img">
            <ImageSlot
              id={`pd-${post.post_id}`}
              placeholder={post.img_url || "이미지"}
              width="100%"
              height={240}
              tint={th.rowBg}
              radius={18}
            />
          </div>

          <div className="pd-body" style={{ color: th.ink }}>
            <p>{post.content}</p>
          </div>

          <div className="pd-meta" style={{ background: th.rowBg, borderColor: th.rowEdge }}>
            <div
              className="pd-meta-key"
              style={{ background: th.cardBg, borderColor: th.rowEdge, color: th.ink }}
            >
              <span className="pd-meta-ic" style={{ background: th.badgeBg }}>
                📋
              </span>
              <span>퀘스트</span>
            </div>
            <div className="pd-meta-val" style={{ color: th.ink }}>
              {post.quest_id}
            </div>
          </div>

          <footer className="pd-foot" style={{ borderColor: th.cardEdge }}>
            <button
              type="button"
              className={`pd-react pd-heart${liked ? " on" : ""}`}
              onClick={() => setLiked((v) => !v)}
            >
              <svg
                aria-hidden="true"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={liked ? th.like : "none"}
                stroke={liked ? th.like : th.ink}
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20.5C12 20.5 3.5 15 3.5 8.8 3.5 6.1 5.6 4 8.2 4c1.7 0 3.1.9 3.8 2.2C12.7 4.9 14.1 4 15.8 4 18.4 4 20.5 6.1 20.5 8.8 20.5 15 12 20.5 12 20.5Z" />
              </svg>
            </button>

            <button type="button" className="pd-react" style={{ color: th.ink }}>
              <svg
                aria-hidden="true"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={th.ink}
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 11.5c0 4-3.9 7-8.5 7-1 0-2-.1-2.9-.4L4 19.5l1.3-3.4C4.2 14.9 3.5 13.3 3.5 11.5c0-4 3.9-7 8.5-7s9 3 9 7Z" />
              </svg>
              <span>{post.comments.length}</span>
            </button>

            <div style={{ flex: 1 }} />

            <button type="button" className="pd-react" style={{ color: th.accent }}>
              <svg
                aria-hidden="true"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={th.accent}
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12.5 20 5l-3 15-5.5-5.5L8 17l.2-4.3Z" />
                <path d="m11.5 14.5 5.5-9.5" />
              </svg>
              <span style={{ fontFamily: "'Jua', sans-serif" }}>공유하기</span>
            </button>
          </footer>
        </article>

        <div className="pd-comments">
          <div className="pd-comments-h" style={{ color: th.ink }}>
            댓글 {post.comments.length}
          </div>
          {post.comments.length === 0 && (
            <div className="pd-comments-empty" style={{ color: th.inkSoft }}>
              아직 댓글이 없어요. 첫 따뜻한 한마디를 남겨보세요 🌷
            </div>
          )}
          {post.comments.map((c) => (
            <div key={c.comment_id} className="pd-comment">
              <div className="pd-comment-av" style={{ color: th.tagInk }}>
                {c.user[0]?.toUpperCase() ?? "?"}
              </div>
              <div
                className="pd-comment-bubble"
                style={{ background: th.rowBg, borderColor: th.rowEdge }}
              >
                <b style={{ color: th.ink }}>{c.user}</b>
                <span style={{ color: th.inkSoft }}>{c.content}</span>
              </div>
            </div>
          ))}
        </div>

        {/* TODO: wire createComment API — 유저가 댓글 입력 시 10분 뒤 캐릭터 답글 예약 */}
        <div className="pd-ci">
          <div className="pd-ci-av">?</div>
          <input
            className="pd-ci-field"
            style={{ background: th.rowBg, borderColor: th.rowEdge, color: th.ink }}
            placeholder="따뜻한 댓글 남기기…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button type="button" className="pd-ci-send" style={{ color: th.accent }}>
            게시
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check + full test suite**

```bash
cd /Users/jpaper/Documents/projects/mong-studio/mongle-web/apps/game && npx tsc --noEmit 2>&1 && npm test 2>&1
```

Expected: TypeScript clean, all tests PASS.

- [ ] **Step 3: Commit**

```bash
git -C /Users/jpaper/Documents/projects/mong-studio/mongle-web add apps/game/src/feed/PostScreen.tsx
git -C /Users/jpaper/Documents/projects/mong-studio/mongle-web commit -m "feat: PostScreen fetches post detail from API, adds comment input UI"
```

---

## Self-review checklist

- [x] All 3 endpoints covered: `fetchPosts`, `fetchPostDetail`, `createComment`
- [x] `fetchCharacters` + `fetchCharacterDetail` included (needed by FeedModal and ProfileScreen)
- [x] Tests written before implementation in Task 1 (TDD RED→GREEN)
- [x] `toFeedPost` adapter handles all `FeedPostData` fields, limitations documented
- [x] `FeedModal` removes `POSTS` mock and `mongsilLikes`, adds loading/error states
- [x] `ProfileScreen` removes `MONGSIL`/`MONGSIL_POSTS`, accepts real props + fetches character detail
- [x] `PostScreen` removes `MONGSIL_POSTS` + `likes`/`onToggleLike` props, fetches own detail
- [x] `selectedCharacterId` replaces hardcoded `p.id === "mongsil"` check
- [x] All imports use `.js` extension (ESM)
- [x] Comment input `<input>` + `<button>` with TODO marker for future `createComment` wiring
- [x] All tasks have exact file paths, complete code, and exact commands
