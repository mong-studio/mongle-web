import React, { useState } from "react";
import { CharacterAvatar } from "./CharacterAvatar.js";
import type { FeedPostData, ThemeTokens } from "./feedData.js";
import { ImageSlot } from "./ImageSlot.js";
import { PixelSprite, SPRITES } from "./PixelSprite.js";

interface FeedPostProps {
  post: FeedPostData;
  th: ThemeTokens;
  onAuthorClick?: () => void;
  onOpen?: () => void;
  onToggleLike?: () => void;
  onShare?: () => void;
}

export function FeedPost({
  post,
  th,
  onAuthorClick,
  onOpen,
  onToggleLike,
  onShare,
}: FeedPostProps) {
  // 좋아요 상태는 상위(apiPosts)에서 내려온 prop을 그대로 따른다 — 상세 화면과 동기화.
  const liked = post.isLiked;
  const likeCount = post.likes;
  const [pop, setPop] = useState(false);
  const px = 3;

  function doLike() {
    if (!liked) {
      setPop(true);
      setTimeout(() => setPop(false), 420);
    }
    onToggleLike?.();
  }

  const heartArt = liked ? SPRITES.heart : SPRITES.heartOutline;
  const heartPal = liked ? { r: th.like, h: "#FFD7DF" } : { r: th.inkFaint };

  return (
    <article className="mg-post" style={{ background: th.cardBg, borderColor: th.cardEdge }}>
      {/* header */}
      <header className="mg-post-head">
        <button
          type="button"
          className="mg-author"
          onClick={onAuthorClick}
          style={{ cursor: onAuthorClick ? "pointer" : "default" }}
        >
          <CharacterAvatar
            imageUrl={post.avatarUrl}
            name={post.name}
            className="mg-avatar"
            imageFit="cover"
            style={{ background: post.avatarUrl ? "#fff" : th.badgeBg, color: th.badgeInk }}
          />
          <div className="mg-post-id">
            <div className="mg-post-namerow">
              <span className="mg-name" style={{ color: th.ink }}>
                {post.name}
              </span>
              {post.role && (
                <span className="mg-badge" style={{ background: th.badgeBg, color: th.badgeInk }}>
                  {post.role}
                </span>
              )}
            </div>
            <div className="mg-meta" style={{ color: th.inkSoft }}>
              {post.time}
            </div>
          </div>
        </button>
      </header>

      {/* hero image — opens detail */}
      <button type="button" className="mg-hero-btn" onClick={onOpen} aria-label="게시물 열기">
        <div className="mg-hero">
          <ImageSlot
            placeholder={post.heroPlaceholder}
            imageUrl={post.imageUrl}
            width="100%"
            height={232}
            tint={th.rowBg}
            radius={18}
          />
        </div>
      </button>

      {/* caption — opens detail */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: caption tap opens detail */}
      <p className="mg-caption" style={{ color: th.ink }} onClick={onOpen}>
        {post.caption.map((line, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static caption array, order never changes
          <React.Fragment key={i}>
            {line}
            {i < post.caption.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>

      {/* footer */}
      <footer className="mg-foot" style={{ borderColor: th.cardEdge }}>
        <button
          type="button"
          className={`mg-foot-btn${pop ? " pop" : ""}`}
          onClick={doLike}
          aria-pressed={liked}
        >
          <PixelSprite art={heartArt} palette={heartPal} px={px} />
          <span style={{ color: liked ? th.like : th.ink }}>{likeCount}</span>
        </button>

        <button type="button" className="mg-foot-btn" onClick={onOpen} aria-label="댓글 보기">
          <PixelSprite art={SPRITES.comment} palette={{ x: th.inkFaint }} px={px} />
          <span style={{ color: th.ink }}>{post.comments}</span>
        </button>

        <button
          type="button"
          className="mg-foot-btn mg-share"
          style={{ color: th.accent }}
          onClick={onShare}
        >
          <PixelSprite art={SPRITES.arrow} palette={{ x: th.accent }} px={2} />
          <span>공유하기</span>
        </button>
      </footer>
    </article>
  );
}
