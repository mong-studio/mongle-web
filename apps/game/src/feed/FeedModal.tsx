import type React from "react";
import { useEffect, useLayoutEffect, useState } from "react";
import { type ApiCharacter, type ApiPost, fetchCharacters, fetchPosts, toFeedPost } from "./api.js";
import { FeedPost } from "./FeedPost.js";
import { THEMES, type ThemeTokens } from "./feedData.js";
import { APPLE_PAL, PixelSprite, SPARK_PAL, SPRITES } from "./PixelSprite.js";
import { PostScreen } from "./PostScreen.js";
import { ProfileScreen } from "./ProfileScreen.js";
import "./feed.css";

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

// ── Village scene background ──────────────────────────────────────────────────
function VillageScene({ th }: { th: ThemeTokens }) {
  return (
    <div
      className="village"
      style={{
        background: `linear-gradient(180deg, ${th.sceneTop} 0%, ${th.sceneTop} 46%, ${th.sceneBottom} 100%)`,
      }}
    >
      <div
        className="village-sun"
        style={{ background: th.sceneSun, boxShadow: `0 0 40px ${th.sceneSun}` }}
      />
      <div
        className="village-cloud"
        style={{ background: th.sceneCloud, width: 96, height: 30, top: 90, left: 40 }}
      />
      <div
        className="village-cloud"
        style={{ background: th.sceneCloud, width: 70, height: 24, top: 140, left: 150 }}
      />
      <div
        className="village-cloud"
        style={{ background: th.sceneCloud, width: 60, height: 20, top: 70, left: 250 }}
      />
      <div className="village-hill" style={{ background: th.sceneHill }} />
    </div>
  );
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

// ── Toast ─────────────────────────────────────────────────────────────────────
type ToastIconKind = "apple" | "arrow" | "spark";
interface ToastItem {
  id: string;
  msg: string;
  icon: ToastIconKind;
}

function ToastIconEl({ kind, th }: { kind: ToastIconKind; th: ThemeTokens }) {
  if (kind === "apple") return <PixelSprite art={SPRITES.apple} palette={APPLE_PAL} px={2.4} />;
  if (kind === "arrow")
    return <PixelSprite art={SPRITES.arrow} palette={{ x: th.accent }} px={2.6} />;
  return <PixelSprite art={SPRITES.spark} palette={SPARK_PAL} px={2.6} />;
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: "마을", icon: "🏡" },
  { id: "할일", icon: "📅" },
  { id: "피드", icon: "📱" },
  { id: "마이", icon: "🙂" },
] as const;

type TabId = (typeof TABS)[number]["id"];
type NavScreen = "feed" | "profile" | "post";

function TabBar({
  active,
  onSelect,
  th,
  bottomPad,
}: {
  active: TabId;
  onSelect: (t: TabId) => void;
  th: ThemeTokens;
  bottomPad: number;
}) {
  return (
    <nav
      className="tabbar"
      style={{ background: th.headerBg, borderColor: th.modalEdge, paddingBottom: bottomPad }}
    >
      {TABS.map((tb) => {
        const on = tb.id === active;
        return (
          <button
            key={tb.id}
            type="button"
            className={`tab${on ? " on" : ""}`}
            style={{ background: on ? th.badgeBg : "transparent" }}
            onClick={() => onSelect(tb.id)}
            aria-current={on ? "page" : undefined}
          >
            <span className="tab-ic" aria-hidden="true">
              {tb.icon}
            </span>
            <span className="tab-lbl" style={{ color: on ? th.badgeInk : th.inkSoft }}>
              {tb.id}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Placeholder screen ────────────────────────────────────────────────────────
function Placeholder({ tab, th, onGoFeed }: { tab: TabId; th: ThemeTokens; onGoFeed: () => void }) {
  const meta: Partial<Record<TabId, { emoji: string; line: string }>> = {
    마을: { emoji: "🏡", line: "몽글마을 광장은 곧 만나요!" },
    할일: { emoji: "📅", line: "오늘의 할일은 곧 만나요!" },
    마이: { emoji: "🙂", line: "마이페이지는 곧 만나요!" },
  };
  const m = meta[tab] ?? { emoji: "✨", line: "곧 만나요!" };
  return (
    <div
      className="ph-card"
      style={{ background: th.modalBg, borderColor: th.modalEdge, color: th.ink }}
    >
      <div className="ph-emoji">{m.emoji}</div>
      <div className="ph-line">{m.line}</div>
      <div className="ph-sub" style={{ color: th.inkSoft }}>
        지금은 친구들의 피드부터 둘러보세요
      </div>
      <button
        type="button"
        className="ph-btn"
        style={{ background: th.accent, color: th.accentInk }}
        onClick={onGoFeed}
      >
        <PixelSprite art={SPRITES.heart} palette={{ r: "#FFFFFF" }} px={2.4} />
        피드 보러가기
      </button>
    </div>
  );
}

// ── Main FeedModal ────────────────────────────────────────────────────────────
interface FeedModalProps {
  onClose: () => void;
}

export function FeedModal({ onClose: _onClose }: FeedModalProps) {
  const [tab, setTab] = useState<TabId>("피드");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [navScreen, setNavScreen] = useState<NavScreen>("feed");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [apiPosts, setApiPosts] = useState<ApiPost[]>([]);
  const [charMap, setCharMap] = useState<Map<string, ApiCharacter>>(new Map());
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "피드") {
      setNavScreen("feed");
      setSelectedPostId(null);
    }
  }, [tab]);

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

  const th = THEMES["크림 당근"];
  const onFeed = tab === "피드";
  const W = 402;
  const H = 874;
  const scale = useScale(W, H);

  const insetTop = 0;
  const tabBottomPad = 22;
  const tabBarH = tabBottomPad + 60;
  const modalBottom = tabBarH;

  function notify(msg: string, icon: string) {
    const id = `t-${performance.now().toFixed(0)}-${Math.floor(Math.random() * 9999)}`;
    setToasts((ts) => [...ts, { id, msg, icon: icon as ToastIconKind }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 1700);
  }

  const screenContent = (
    <div className="feed-screen">
      {/* village scene backdrop */}
      <VillageScene th={th} />
      {/* blur scrim — fully opaque on feed tab, dimmed on others */}
      <div className="feed-scrim" style={{ opacity: onFeed ? 1 : 0.5 }} />
      {/* pixel texture overlay */}
      <div className="pixfx" />

      {/* floating feed modal card */}
      <div
        className={`feed-modal${onFeed ? "" : " closed"}`}
        style={{
          top: insetTop,
          bottom: modalBottom,
          background: th.modalBg,
          borderColor: th.modalEdge,
        }}
      >
        <div
          className="mhead"
          style={{
            background: th.headerBg,
            borderBottom: `1.5px solid ${th.modalEdge}`,
          }}
        >
          <div
            className="memblem"
            style={{ background: th.cardBg, boxShadow: `0 2px 0 ${th.modalEdge}` }}
          >
            <PixelSprite art={SPRITES.apple} palette={APPLE_PAL} px={2.7} />
          </div>
          <div className="mhead-txt">
            <div className="mtitle" style={{ color: th.ink }}>
              몽글마을 피드
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
      </div>

      {/* placeholder screen for non-feed tabs */}
      {!onFeed && (
        <div
          className="ph-wrap"
          style={{
            position: "absolute",
            top: insetTop,
            bottom: modalBottom,
            left: 0,
            right: 0,
            zIndex: 12,
          }}
        >
          <Placeholder tab={tab} th={th} onGoFeed={() => setTab("피드")} />
        </div>
      )}

      <TabBar active={tab} onSelect={setTab} th={th} bottomPad={tabBottomPad} />

      <div className="feed-toasts" style={{ bottom: tabBarH + 14 }}>
        {toasts.map((to) => (
          <div
            key={to.id}
            className="feed-toast"
            style={{ background: th.cardBg, borderColor: th.modalEdge, color: th.ink }}
          >
            <ToastIconEl kind={to.icon} th={th} />
            {to.msg}
          </div>
        ))}
      </div>

      {navScreen !== "feed" && onFeed && (
        <>
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
          {navScreen === "post" && selectedPostId && (
            <PostScreen
              postId={selectedPostId}
              th={th}
              onBack={() => setNavScreen("profile")}
              onOpenProfile={() => setNavScreen("profile")}
            />
          )}
        </>
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
