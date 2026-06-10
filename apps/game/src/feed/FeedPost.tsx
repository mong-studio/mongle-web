import React, { useState } from "react";
import type { FeedPostData, ThemeTokens } from "./feedData.js";
import { ImageSlot } from "./ImageSlot.js";
import { PixelSprite, SPRITES } from "./PixelSprite.js";

interface FeedPostProps {
  post: FeedPostData;
  th: ThemeTokens;
  pixelMode: boolean;
  notify: (msg: string, icon: string) => void;
}

function Tag({ text, th }: { text: string; th: ThemeTokens }) {
  return (
    <span className="mg-tag" style={{ background: th.tagBg, color: th.tagInk }}>
      #{text}
    </span>
  );
}

function InfoRow({
  icon,
  label,
  children,
  th,
  last,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
  th: ThemeTokens;
  last?: boolean;
}) {
  return (
    <div
      className="mg-inforow"
      style={{ background: th.rowBg, borderColor: th.rowEdge, marginBottom: last ? 0 : 8 }}
    >
      <div className="mg-inforow-l">
        <span className="mg-inforow-ic" aria-hidden="true">
          {icon}
        </span>
        <span className="mg-inforow-lbl" style={{ color: th.ink }}>
          {label}
        </span>
      </div>
      <div className="mg-inforow-div" style={{ background: th.rowEdge }} />
      <div className="mg-inforow-r" style={{ color: th.ink }}>
        {children}
      </div>
    </div>
  );
}

const MENU_ITEMS = [
  ["🔖", "게시물 저장하기"],
  ["🔔", "알림 받기"],
  ["🙈", "이 게시물 숨기기"],
] as const;

export function FeedPost({ post, th, pixelMode, notify }: FeedPostProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pop, setPop] = useState(false);
  const px = 3;

  function doLike() {
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
      return;
    }
    setLiked(true);
    setLikeCount((c) => c + 1);
    setPop(true);
    setTimeout(() => setPop(false), 420);
  }

  const heartArt = liked ? SPRITES.heart : SPRITES.heartOutline;
  const heartPal = liked ? { r: th.like, h: "#FFD7DF" } : { r: th.inkSoft };

  return (
    <article className="mg-post" style={{ background: th.cardBg, borderColor: th.cardEdge }}>
      {/* header */}
      <header className="mg-post-head">
        <div
          className="mg-avatar"
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: post.tint,
            flexShrink: 0,
            boxShadow: "0 2px 0 rgba(80,55,30,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            userSelect: "none",
          }}
          aria-hidden="true"
        >
          {post.name[0]}
        </div>

        <div className="mg-post-id">
          <div className="mg-post-namerow">
            <span className="mg-name" style={{ color: th.ink }}>
              {post.name}
            </span>
            <span className="mg-badge" style={{ background: th.badgeBg, color: th.badgeInk }}>
              {post.role}
            </span>
          </div>
          <div className="mg-meta" style={{ color: th.inkSoft }}>
            {post.time} · {post.place}
          </div>
        </div>

        <div className="mg-menu-wrap">
          <button
            type="button"
            className="mg-iconbtn"
            aria-label="더보기"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="mg-dots">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 1,
                    display: "block",
                    background: th.inkSoft,
                  }}
                />
              ))}
            </span>
          </button>

          {menuOpen && (
            <div
              className="mg-menu"
              style={{ background: th.cardBg, borderColor: th.cardEdge, color: th.ink }}
            >
              {MENU_ITEMS.map(([ic, label]) => (
                <button
                  key={label}
                  type="button"
                  className="mg-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    notify(label.replace(/하기$/, "했어요").replace("받기", "받을게요"), "spark");
                  }}
                >
                  <span>{ic}</span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* hero image */}
      <div className="mg-hero">
        <ImageSlot
          id={`hero-${post.id}`}
          placeholder={post.heroPlaceholder}
          width="100%"
          height={232}
          tint={th.rowBg}
          radius={14}
          pixelated={pixelMode}
        />
      </div>

      {/* caption */}
      <p className="mg-caption" style={{ color: th.ink }}>
        {post.caption.map((line, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static caption array, order never changes
          <React.Fragment key={i}>
            {line}
            {i < post.caption.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>

      {/* info rows */}
      <div className="mg-info">
        <InfoRow icon="📋" label={post.quest.label} th={th}>
          {post.quest.value}
        </InfoRow>
        <InfoRow icon="#️⃣" label="해시태그" th={th} last>
          <span className="mg-tags">
            {post.tags.map((t) => (
              <Tag key={t} text={t} th={th} />
            ))}
          </span>
        </InfoRow>
      </div>

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

        <button
          type="button"
          className="mg-foot-btn"
          onClick={() => setCommentsOpen((o) => !o)}
          aria-expanded={commentsOpen}
        >
          <PixelSprite art={SPRITES.comment} palette={{ x: th.ink }} px={px} />
          <span style={{ color: th.ink }}>{post.comments}</span>
        </button>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          className="mg-foot-btn mg-share"
          style={{ color: th.accent }}
          onClick={() => notify("공유 링크를 복사했어요", "arrow")}
        >
          <PixelSprite art={SPRITES.arrow} palette={{ x: th.accent }} px={px} />
          <span>공유하기</span>
        </button>
      </footer>

      {/* comments expandable */}
      <div className={`mg-comments${commentsOpen ? " open" : ""}`}>
        <div className="mg-comments-inner" style={{ borderColor: th.cardEdge }}>
          {post.commentList.map((c, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static comment list, order never changes
            <div key={i} className="mg-comment">
              <span className="mg-comment-dot" style={{ background: th.badgeBg }} />
              <span className="mg-comment-who" style={{ color: th.ink }}>
                {c.who}
              </span>
              <span className="mg-comment-txt" style={{ color: th.inkSoft }}>
                {c.txt}
              </span>
            </div>
          ))}
          <div
            className="mg-comment-input"
            style={{ background: th.rowBg, borderColor: th.rowEdge, color: th.inkSoft }}
          >
            <span>따뜻한 댓글을 남겨보세요…</span>
            <button
              type="button"
              className="mg-comment-send"
              style={{ background: th.accent, color: th.accentInk }}
              onClick={() => notify("댓글을 남겼어요", "spark")}
            >
              보내기
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
