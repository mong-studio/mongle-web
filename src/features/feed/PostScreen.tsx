import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { type ApiPost, createComment, fetchPostDetail, toggleLike } from "./api.js";
import type { ThemeTokens } from "./feedData.js";
import { ImageSlot } from "./ImageSlot.js";
import { APPLE_PAL, PixelSprite, SPRITES } from "./PixelSprite.js";
import { ShareSheet } from "./ShareSheet.js";
import { buildPostShare } from "./share.js";

interface PostScreenProps {
  postId: string;
  th: ThemeTokens;
  onBack: () => void;
  onOpenProfile: () => void;
  onNotice: (message: string) => void;
  onApplesRefresh: () => void;
}

const ME = "나";
// 서버(apps/posts/views.py)의 댓글 작성 정책과 일치시켜 둔다.
const COMMENT_TOKEN_COST = 3;
const DAILY_COMMENT_LIMIT = 5;

// 서버가 돌려주는 상태코드를 몽글마을 말투의 안내 문구로 변환한다.
function commentErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 429) {
      return "오늘은 댓글을 5개까지 남길 수 있어요. 내일 또 만나요 🌷";
    }
    if (error.response?.status === 402) {
      return "사과가 부족해 댓글을 남길 수 없어요.";
    }
  }
  return "댓글을 남기지 못했어요. 잠시 후 다시 시도해주세요.";
}

export function PostScreen({
  postId,
  th,
  onBack,
  onOpenProfile,
  onNotice,
  onApplesRefresh,
}: PostScreenProps) {
  const [post, setPost] = useState<ApiPost | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeSaving, setLikeSaving] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [postError, setPostError] = useState(false);

  // 게시 버튼 → 토큰 안내 확인 모달을 먼저 띄운다.
  function requestComment() {
    if (!post || commentSaving || !commentText.trim()) return;
    setConfirmOpen(true);
  }

  async function submitComment() {
    const content = commentText.trim();
    if (!post || commentSaving || !content) return;
    setConfirmOpen(false);
    setCommentSaving(true);
    try {
      const newComment = await createComment(post.post_id, content);
      // 응답 댓글을 목록에 바로 추가 (답글은 약 10분 뒤 서버가 생성)
      setPost((prev) => (prev ? { ...prev, comments: [...prev.comments, newComment] } : prev));
      setCommentText("");
      setDailyCount((c) => c + 1); // 오늘 할당량 표시 갱신
      onApplesRefresh(); // 차감된 사과 잔액을 HUD에 반영
    } catch (error) {
      // 실패 시 입력값은 보존 — 사용자가 다시 시도할 수 있게 둔다
      onNotice(commentErrorMessage(error));
    } finally {
      setCommentSaving(false);
    }
  }

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
        setDailyCount(p.daily_comment_count ?? 0);
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

        {/* 댓글 게시 시 약 2분 뒤 서버가 캐릭터 답글을 예약 생성한다 */}
        <div className="pd-ci">
          <div className="pd-ci-av" style={{ color: th.badgeInk }}>
            {ME}
          </div>
          <input
            className="pd-ci-field"
            style={{ background: th.rowBg, borderColor: th.rowEdge, color: th.ink }}
            placeholder="댓글을 입력해주세요…"
            value={commentText}
            maxLength={50}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                requestComment();
              }
            }}
          />
          <button
            type="button"
            className="pd-ci-send"
            style={{ color: th.accent }}
            onClick={requestComment}
            disabled={commentSaving || !commentText.trim()}
          >
            게시
          </button>
        </div>
      </div>

      {confirmOpen && (
        // biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop stop-propagation
        // biome-ignore lint/a11y/useKeyWithClickEvents: modal backdrop stop-propagation
        <div className="pd-confirm-backdrop" onClick={() => setConfirmOpen(false)}>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation only */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation only */}
          <div
            className="pd-confirm-card"
            style={{ background: th.cardBg, borderColor: th.modalEdge }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pd-confirm-icon" aria-hidden="true">
              <PixelSprite art={SPRITES.apple} palette={APPLE_PAL} px={3.4} />
            </div>
            <div className="pd-confirm-title" style={{ color: th.ink }}>
              {authorName}에게 댓글을 남길까요?
            </div>
            <div className="pd-confirm-quota" style={{ color: th.inkFaint }}>
              오늘 남긴 댓글 {dailyCount}/{DAILY_COMMENT_LIMIT}
            </div>
            <div className="pd-confirm-actions">
              <button
                type="button"
                className="pd-confirm-cancel"
                style={{ background: th.rowBg, borderColor: th.rowEdge, color: th.inkSoft }}
                onClick={() => setConfirmOpen(false)}
              >
                다음에
              </button>
              <button
                type="button"
                className="pd-confirm-ok"
                style={{ background: th.accent, color: "#fff" }}
                onClick={submitComment}
              >
                남기기
                <span className="pd-confirm-cost">
                  <PixelSprite art={SPRITES.apple} palette={APPLE_PAL} px={1.7} />-
                  {COMMENT_TOKEN_COST}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

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
