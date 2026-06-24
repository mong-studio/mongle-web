import { useEffect, useState } from "react";
import { type ApiCharacterDetail, type ApiPost, fetchCharacterDetail } from "./api.js";
import { CharacterAvatar } from "./CharacterAvatar.js";
// 이웃 여부는 캐릭터 활성 상태(is_active)를 그대로 따른다 — 사용자가 바꿀 수 없다.
import type { ThemeTokens } from "./feedData.js";
import { ImageSlot } from "./ImageSlot.js";

interface ProfileScreenProps {
  th: ThemeTokens;
  onBack: () => void;
  onOpenPost: (id: string) => void;
  posts: ApiPost[];
  characterId: string;
  neighborCount: number;
}

export function ProfileScreen({
  th,
  onBack,
  onOpenPost,
  posts,
  characterId,
  neighborCount,
}: ProfileScreenProps) {
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
  const heartCount = characterPosts.filter((p) => p.is_liked).length;
  // 활성 캐릭터만 이웃으로 표시한다(읽기 전용). 상세 로딩 전에는 아직 판단하지 않는다.
  const isNeighbor = character?.is_active === true;
  const bio = character?.personality ?? "";
  // 이웃은 백엔드 미구현 — "캐릭터·나 모두 서로 이웃" 설정으로 계산(상위에서 내려받음).

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
        </div>
        {/* 우측 정렬용 스페이서 — 제목 가운데 정렬 유지 */}
        <div className="pf-iconbtn" aria-hidden="true" />
      </div>

      <div className="pf-scroll">
        <div className="pf-head">
          <CharacterAvatar
            imageUrl={character?.gen_img_url}
            name={character?.name}
            alt={character?.name ?? ""}
            className="pf-avatar"
            style={{
              background: "#fff",
              boxShadow: `0 0 0 2.5px ${th.modalBg}, 0 0 0 4.5px ${th.accent}`,
            }}
          />
          <div className="pf-stats">
            {(
              [
                ["게시물", characterPosts.length],
                ["하트", heartCount],
                ["이웃", neighborCount],
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

        {/* 소개란 — 이름(상단 표시와 중복) 대신 persona의 [성격] 구획만 간결하게 */}
        {bio && (
          <div className="pf-id">
            <p className="pf-bio" style={{ color: th.inkSoft }}>
              {bio}
            </p>
          </div>
        )}

        <div className="pf-actions">
          {/* 읽기 전용 이웃 상태: 활성=✓ 이웃, 비활성(이사)=옛 친구 */}
          <div
            className="pf-btn pf-btn-static"
            style={
              isNeighbor
                ? { background: th.accent, color: th.accentInk }
                : { background: th.rowBg, color: th.inkSoft }
            }
          >
            {isNeighbor ? "✓ 이웃" : "옛 친구"}
          </div>
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
