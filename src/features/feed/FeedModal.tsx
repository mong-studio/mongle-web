import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  type ApiCharacter,
  type ApiPost,
  fetchCharacters,
  fetchPosts,
  toFeedPost,
  toggleLike,
} from "./api.js";
import { FeedPost } from "./FeedPost.js";
import { THEMES, type ThemeTokens } from "./feedData.js";
import { APPLE_PAL, PixelSprite, SPRITES } from "./PixelSprite.js";
import { PostScreen } from "./PostScreen.js";
import { ProfileScreen } from "./ProfileScreen.js";
import { ShareSheet } from "./ShareSheet.js";
import { buildPostShare, type SharePayload } from "./share.js";
import "./feed.css";

const PAGE_SIZE = 5;
const LOAD_MORE = 3;

function useScale(W: number, H: number) {
  const [s, setS] = useState(0.6);
  useLayoutEffect(() => {
    function calc() {
      const v = Math.min((window.innerWidth - 52) / W, (window.innerHeight - 52) / H, 1.15);
      setS(v > 0 ? v : 0.5);
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [W, H]);
  return s;
}

// ── iPhone frame ──────────────────────────────────────────────────────────────
function PhoneFrame({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 48,
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 40px 80px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.12)",
      }}
    >
      {/* dynamic island */}
      <div
        style={{
          position: "absolute",
          top: 11,
          left: "50%",
          transform: "translateX(-50%)",
          width: 126,
          height: 37,
          borderRadius: 24,
          background: "#000",
          zIndex: 50,
          pointerEvents: "none",
        }}
      />
      {children}
      {/* home indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          height: 34,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          paddingBottom: 8,
          pointerEvents: "none",
        }}
      >
        <div style={{ width: 139, height: 5, borderRadius: 100, background: "rgba(0,0,0,.25)" }} />
      </div>
    </div>
  );
}

// ── 무한스크롤 로딩 인디케이터 ─────────────────────────────────────────────────
function LoadingDots({ th }: { th: ThemeTokens }) {
  return (
    <div className="feed-loading">
      {[0, 1, 2].map((i) => (
        <span key={i} className="feed-dot" style={{ background: th.accent }} />
      ))}
    </div>
  );
}

type NavScreen = "feed" | "profile" | "post";

// ── Main FeedModal ────────────────────────────────────────────────────────────
interface FeedModalProps {
  onClose: () => void;
  onNotice: (message: string) => void;
  onApplesRefresh: () => void;
}

export function FeedModal({ onClose: _onClose, onNotice, onApplesRefresh }: FeedModalProps) {
  const [navScreen, setNavScreen] = useState<NavScreen>("feed");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [postBackTo, setPostBackTo] = useState<NavScreen>("feed");
  const [apiPosts, setApiPosts] = useState<ApiPost[]>([]);
  const [charMap, setCharMap] = useState<Map<string, ApiCharacter>>(new Map());
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [posts, chars] = await Promise.all([
          fetchPosts(),
          fetchCharacters().catch(() => [] as ApiCharacter[]),
        ]);
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

  // 좋아요는 apiPosts를 단일 소스로 둔다 — 피드/상세/프로필이 같은 상태를 공유한다.
  function setPostLiked(postId: string, value: boolean) {
    setApiPosts((prev) => prev.map((p) => (p.post_id === postId ? { ...p, is_liked: value } : p)));
  }

  // 피드 목록에서의 토글: 낙관적 갱신 후 서버 응답으로 보정, 실패 시 롤백.
  // ponytail: 연타 시 race 가능, 서버 응답이 최종값으로 수렴하므로 무시
  async function toggleLikeFor(postId: string) {
    const cur = apiPosts.find((p) => p.post_id === postId);
    if (!cur) return;
    const next = !cur.is_liked;
    setPostLiked(postId, next);
    try {
      setPostLiked(postId, await toggleLike(postId));
    } catch {
      setPostLiked(postId, !next);
    }
  }

  const hasMore = visibleCount < apiPosts.length;

  // 무한 스크롤 — 센티넬 노출 시 0.9초 뒤 추가 로드
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || navScreen !== "feed") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((c) => Math.min(c + LOAD_MORE, apiPosts.length));
            setLoadingMore(false);
          }, 900);
        }
      },
      { threshold: 0.1, rootMargin: "80px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadingMore, hasMore, apiPosts.length, navScreen]);

  const th = THEMES["크림 당근"];
  const W = 402;
  const H = 874;
  const scale = useScale(W, H);

  const visiblePosts = apiPosts.slice(0, visibleCount);

  function openPostFrom(postId: string, characterId: string, from: NavScreen) {
    setSelectedPostId(postId);
    setSelectedCharacterId(characterId);
    setPostBackTo(from);
    setNavScreen("post");
  }

  const screenContent = (
    <div className="feed-screen" style={{ background: th.modalBg }}>
      <div
        className="feed-modal"
        style={{ top: 0, bottom: 0, background: th.modalBg, borderColor: th.modalEdge }}
      >
        <div
          className="mhead"
          style={{ background: th.headerBg, borderBottom: `1px solid ${th.modalEdge}` }}
        >
          <div
            className="memblem"
            style={{ background: "linear-gradient(155deg,#FBE3CC,#F4C7A4)" }}
          >
            <PixelSprite art={SPRITES.apple} palette={APPLE_PAL} px={2.7} />
          </div>
          <div className="mhead-txt">
            <div className="mtitle" style={{ color: th.ink }}>
              우리 마을 소식
            </div>
            <div className="msub" style={{ color: th.inkSoft }}>
              친구들의 따뜻한 소식 {apiPosts.length}개
            </div>
          </div>
        </div>

        <div className="feed">
          {feedLoading && (
            <div style={{ padding: 32, textAlign: "center", color: th.inkSoft }}>
              불러오는 중...
            </div>
          )}
          {feedError && (
            <div style={{ padding: 32, textAlign: "center", color: th.like }}>{feedError}</div>
          )}
          {!feedLoading &&
            !feedError &&
            visiblePosts.map((p) => (
              <FeedPost
                key={p.post_id}
                post={toFeedPost(p, charMap)}
                th={th}
                onAuthorClick={() => {
                  setSelectedCharacterId(p.character);
                  setNavScreen("profile");
                }}
                onOpen={() => openPostFrom(p.post_id, p.character, "feed")}
                onToggleLike={() => toggleLikeFor(p.post_id)}
                onShare={() =>
                  setSharePayload(
                    buildPostShare(
                      p.post_id,
                      charMap.get(p.character)?.name ?? "몽글마을 친구",
                      p.content,
                      p.img_url,
                    ),
                  )
                }
              />
            ))}

          {!feedLoading && !feedError && apiPosts.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: th.inkSoft }}>
              아직 게시글이 없어요 🌱
            </div>
          )}

          {/* 무한스크롤 센티넬 */}
          <div ref={sentinelRef} style={{ height: 1 }} />
          {loadingMore && <LoadingDots th={th} />}
          {!feedLoading && !feedError && apiPosts.length > 0 && !hasMore && (
            <div className="feed-end" style={{ color: th.inkFaint }}>
              — 몽글마을의 하루 끝 —
            </div>
          )}
        </div>
      </div>

      {navScreen === "profile" && selectedCharacterId && (
        <ProfileScreen
          th={th}
          onBack={() => setNavScreen("feed")}
          onOpenPost={(id) => openPostFrom(id, selectedCharacterId, "profile")}
          posts={apiPosts}
          characterId={selectedCharacterId}
          neighborCount={charMap.size + 1 - (charMap.has(selectedCharacterId) ? 1 : 0)}
        />
      )}
      {navScreen === "post" && selectedPostId && (
        <PostScreen
          postId={selectedPostId}
          th={th}
          onBack={() => setNavScreen(postBackTo)}
          onOpenProfile={() => setNavScreen("profile")}
          onLikeChange={setPostLiked}
          onNotice={onNotice}
          onApplesRefresh={onApplesRefresh}
          authorActive={selectedCharacterId ? charMap.has(selectedCharacterId) : false}
          authorAvatarUrl={
            selectedCharacterId ? charMap.get(selectedCharacterId)?.gen_img_url : undefined
          }
        />
      )}

      {sharePayload && (
        <ShareSheet th={th} share={sharePayload} onClose={() => setSharePayload(null)} />
      )}
    </div>
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop stop-propagation
    // biome-ignore lint/a11y/useKeyWithClickEvents: modal backdrop stop-propagation
    <div className="feed-modal-wrapper" onClick={(e) => e.stopPropagation()}>
      <div style={{ width: W * scale, height: H * scale, position: "relative", flexShrink: 0 }}>
        <div className="feed-scaler" style={{ transform: `scale(${scale})`, width: W, height: H }}>
          <PhoneFrame width={W} height={H}>
            {screenContent}
          </PhoneFrame>
        </div>
      </div>
    </div>
  );
}
