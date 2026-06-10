import { useState } from "react";
import type { ThemeTokens } from "./feedData.js";
import { MONGSIL, MONGSIL_POSTS } from "./feedData.js";
import { ImageSlot } from "./ImageSlot.js";

type LikeMap = Record<string, { count: number; liked: boolean }>;

interface ProfileScreenProps {
  th: ThemeTokens;
  onBack: () => void;
  onOpenPost: (id: string) => void;
  likes: LikeMap;
}

export function ProfileScreen({ th, onBack, onOpenPost, likes }: ProfileScreenProps) {
  const [following, setFollowing] = useState(false);
  const totalHearts = MONGSIL_POSTS.reduce((s, p) => s + (likes[p.id]?.count ?? p.hearts), 0);

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
            {MONGSIL.name}
          </div>
          <div className="pf-topbar-sub" style={{ color: th.inkSoft }}>
            @mongsil
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
        {/* avatar + stats */}
        <div className="pf-head">
          <div
            className="pf-avatar"
            style={{ boxShadow: `0 0 0 2.5px ${th.modalBg}, 0 0 0 4.5px ${th.accent}` }}
          >
            {MONGSIL.emoji}
          </div>
          <div className="pf-stats">
            {(
              [
                ["게시물", MONGSIL.stats.posts],
                ["하트", totalHearts],
                ["이웃", MONGSIL.stats.followers],
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

        {/* name + badge */}
        <div className="pf-id">
          <span className="pf-name" style={{ color: th.ink }}>
            {MONGSIL.name}
          </span>
          <span className="pf-badge" style={{ background: th.badgeBg, color: th.badgeInk }}>
            {MONGSIL.role}
          </span>
        </div>

        {/* bio */}
        <div className="pf-bio">
          {MONGSIL.bio.split("\n").map((ln, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static bio lines
            <p key={i} style={{ color: th.ink }}>
              {ln}
            </p>
          ))}
        </div>

        {/* location */}
        <div className="pf-loc" style={{ color: th.inkSoft }}>
          <svg
            aria-hidden="true"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke={th.accent}
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 21s6.5-5.6 6.5-10.5A6.5 6.5 0 0 0 5.5 10.5C5.5 15.4 12 21 12 21Z" />
            <circle cx="12" cy="10.3" r="2.2" />
          </svg>
          <span>{MONGSIL.location}</span>
        </div>

        {/* follow button */}
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

        {/* post grid */}
        <div className="pf-grid-wrap" style={{ borderColor: th.modalEdge }}>
          <div className="pf-grid">
            {MONGSIL_POSTS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="pf-grid-item"
                style={{ background: th.rowBg }}
                onClick={() => onOpenPost(p.id)}
              >
                <div className="pf-grid-img">
                  <ImageSlot
                    id={`pf-${p.id}`}
                    placeholder={`${p.food} ${p.title}`}
                    width="100%"
                    height={130}
                    tint={th.rowBg}
                    radius={5}
                  />
                </div>
                <span className="pf-grid-heart">♥ {likes[p.id]?.count ?? p.hearts}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
