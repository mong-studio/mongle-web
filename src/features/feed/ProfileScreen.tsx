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

export function ProfileScreen({ th, onBack, onOpenPost, posts, characterId }: ProfileScreenProps) {
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
                ["하트", 0],
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
                    placeholder="사진"
                    imageUrl={p.img_url}
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
