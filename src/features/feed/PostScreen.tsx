import { useEffect, useState } from "react";
import { type ApiPost, fetchPostDetail, toggleLike } from "./api.js";
import type { ThemeTokens } from "./feedData.js";
import { ImageSlot } from "./ImageSlot.js";
import { PixelSprite, SPRITES } from "./PixelSprite.js";
import { ShareSheet } from "./ShareSheet.js";
import { buildPostShare } from "./share.js";

interface PostScreenProps {
  postId: string;
  th: ThemeTokens;
  onBack: () => void;
  onOpenProfile: () => void;
}

const ME = "나";

export function PostScreen({ postId, th, onBack, onOpenProfile }: PostScreenProps) {
  const [post, setPost] = useState<ApiPost | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeSaving, setLikeSaving] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [postError, setPostError] = useState(false);

  async function doLike() {
    if (!post || likeSaving) return;
    const next = !liked;
    setLiked(next); // 낙관적 업데이트
    setLikeSaving(true);
    try {
      const serverLiked = await toggleLike(post.post_id);
      setLiked(serverLiked);
    } catch {
      setLiked(!next); // 실패 시 롤백
    } finally {
      setLikeSaving(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchPostDetail(postId)
      .then((p) => {
        if (cancelled) return;
        setPost(p);
        setLiked(p.is_liked);
      })
      .catch(() => {
        if (cancelled) return;
        setPostError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  if (!post) {
    return (
      <div className="pd-screen" style={{ background: th.modalBg }}>
        <div style={{ padding: 48, textAlign: "center", color: th.inkSoft }}>
          {postError ? "게시물을 불러오지 못했어요." : "불러오는 중..."}
        </div>
      </div>
    );
  }

  const heartArt = liked ? SPRITES.heart : SPRITES.heartOutline;
  const heartPal = liked ? { r: th.like, h: "#FFD7DF" } : { r: th.inkFaint };
  const authorName = post.character_name || post.character.slice(0, 8);

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
            <div className="pd-avatar" style={{ color: th.badgeInk }}>
              {authorName[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="pd-author-txt">
              <div className="pd-author-name" style={{ color: th.ink }}>
                {authorName}
              </div>
              <div className="pd-author-meta" style={{ color: th.inkSoft }}>
                {new Date(post.created_at).toLocaleDateString("ko-KR")}
              </div>
            </div>
          </button>

          <div className="pd-img">
            <ImageSlot
              placeholder="사진"
              imageUrl={post.img_url}
              width="100%"
              height={240}
              tint={th.rowBg}
              radius={18}
            />
          </div>

          <div className="pd-body" style={{ color: th.ink }}>
            {post.content.split("\n").map((line, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static content lines, order never changes
              <p key={i}>{line}</p>
            ))}
          </div>

          <footer className="pd-foot" style={{ borderColor: th.cardEdge }}>
            <button
              type="button"
              className={`pd-react${liked ? " on" : ""}`}
              onClick={doLike}
              aria-pressed={liked}
              aria-label="좋아요"
            >
              <PixelSprite art={heartArt} palette={heartPal} px={3} />
            </button>

            <button type="button" className="pd-react" style={{ color: th.ink }}>
              <PixelSprite art={SPRITES.comment} palette={{ x: th.inkFaint }} px={3} />
              <span>{post.comments.length}</span>
            </button>

            <div style={{ flex: 1 }} />

            <button
              type="button"
              className="pd-react"
              style={{ color: th.accent }}
              onClick={() => setShareOpen(true)}
            >
              <PixelSprite art={SPRITES.arrow} palette={{ x: th.accent }} px={2} />
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
            <div key={c.comment_id} className="pd-comment-group">
              {/* 사람이 단 댓글 */}
              <div className="pd-comment">
                <div className="pd-comment-av" style={{ color: th.tagInk, background: th.tagBg }}>
                  {c.user_name[0]?.toUpperCase() ?? "?"}
                </div>
                <div
                  className="pd-comment-bubble"
                  style={{ background: th.rowBg, borderColor: th.rowEdge }}
                >
                  <b style={{ color: th.ink }}>{c.user_name}</b>
                  <span style={{ color: th.inkSoft }}>{c.content}</span>
                </div>
              </div>

              {/* 캐릭터가 단 답글 (스레드) */}
              {c.replies.map((r) => (
                <div key={r.reply_id} className="pd-reply">
                  <div
                    className="pd-comment-av"
                    style={{ color: th.badgeInk, background: th.badgeBg }}
                  >
                    {r.character_name[0] ?? "?"}
                  </div>
                  <div
                    className="pd-comment-bubble"
                    style={{ background: th.badgeBg, borderColor: th.badgeBg }}
                  >
                    <b style={{ color: th.ink }}>{r.character_name}</b>
                    <span style={{ color: th.inkSoft }}>{r.content}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* TODO: wire createComment API — 유저가 댓글 입력 시 캐릭터 답글 예약 */}
        <div className="pd-ci">
          <div className="pd-ci-av" style={{ color: th.badgeInk }}>
            {ME}
          </div>
          <input
            className="pd-ci-field"
            style={{ background: th.rowBg, borderColor: th.rowEdge, color: th.ink }}
            placeholder="댓글을 입력해주세요…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button type="button" className="pd-ci-send" style={{ color: th.accent }}>
            게시
          </button>
        </div>
      </div>

      {shareOpen && (
        <ShareSheet
          th={th}
          share={buildPostShare(post.post_id, authorName, post.content)}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
