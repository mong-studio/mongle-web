import { useEffect, useRef, useState } from "react";
import { useBackdropDismiss } from "../../shared/ui/useBackdropDismiss.js";
import {
  type ApiComment,
  type ApiPost,
  createComment,
  fetchPostDetail,
  toggleLike,
} from "./api.js";
import { CharacterAvatar } from "./CharacterAvatar.js";
import {
  COMMENT_TOKEN_COST,
  canCommentOnAuthor,
  commentErrorMessage,
  DAILY_COMMENT_LIMIT,
  INACTIVE_AUTHOR_MESSAGE,
} from "./commentPolicy.js";
import { FeedTimestamp } from "./FeedTimestamp.js";
import type { ThemeTokens } from "./feedData.js";
import { ImageSlot } from "./ImageSlot.js";
import { APPLE_PAL, PixelSprite, SPRITES } from "./PixelSprite.js";
import { ShareSheet } from "./ShareSheet.js";
import { buildPostShare } from "./share.js";
import { UserAvatar } from "./UserAvatar.js";

interface PostScreenProps {
  postId: string;
  th: ThemeTokens;
  onBack: () => void;
  onOpenProfile: () => void;
  onLikeChange: (postId: string, value: boolean) => void;
  // 댓글 수를 피드 목록과 동기화한다(좋아요의 onLikeChange 와 동형).
  onCommentsChange: (postId: string, comments: ApiComment[]) => void;
  onNotice: (message: string) => void;
  onApplesRefresh: () => void;
  authorActive: boolean;
  authorAvatarUrl?: string;
}

export function PostScreen({
  postId,
  th,
  onBack,
  onOpenProfile,
  onLikeChange,
  onCommentsChange,
  onNotice,
  onApplesRefresh,
  authorActive,
  authorAvatarUrl,
}: PostScreenProps) {
  const canComment = canCommentOnAuthor(authorActive);
  const [post, setPost] = useState<ApiPost | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeSaving, setLikeSaving] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [postError, setPostError] = useState(false);
  const confirmBackdrop = useBackdropDismiss(() => setConfirmOpen(false));
  const confirmOkRef = useRef<HTMLButtonElement>(null);

  // 확인 모달: 열리면 기본 버튼에 포커스, Esc 로 닫는다(키보드 접근성).
  useEffect(() => {
    if (!confirmOpen) return;
    confirmOkRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

  // 게시 버튼 → 토큰 안내 확인 모달을 먼저 띄운다.
  function requestComment() {
    if (!post || commentSaving || !commentText.trim()) return;
    if (!canComment) return; // 이사 간 주민에게는 댓글 불가
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
      const nextComments = [...post.comments, newComment];
      setPost((prev) => (prev ? { ...prev, comments: nextComments } : prev));
      onCommentsChange(post.post_id, nextComments); // 피드 목록 카운트도 동기화
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
    onLikeChange(post.post_id, next); // 피드 목록과 동기화
    setLikeSaving(true);
    try {
      const serverLiked = await toggleLike(post.post_id);
      setLiked(serverLiked);
      onLikeChange(post.post_id, serverLiked);
    } catch {
      setLiked(!next); // 실패 시 롤백
      onLikeChange(post.post_id, !next);
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
  const postAuthorAvatarUrl = post.gen_img_url ?? authorAvatarUrl;

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
        {/* 우측 정렬용 스페이서 — 제목 가운데 정렬 유지 */}
        <div className="pd-iconbtn" aria-hidden="true" />
      </div>

      <div className="pd-scroll">
        <article className="pd-post" style={{ background: th.cardBg, borderColor: th.cardEdge }}>
          <button type="button" className="pd-author" onClick={onOpenProfile}>
            <CharacterAvatar
              imageUrl={postAuthorAvatarUrl}
              name={authorName}
              className="pd-avatar"
              style={{
                background: postAuthorAvatarUrl ? "#fff" : th.badgeBg,
                color: th.badgeInk,
              }}
            />
            <div className="pd-author-txt">
              <div className="pd-author-name" style={{ color: th.ink }}>
                {authorName}
              </div>
              <div className="pd-author-meta" style={{ color: th.inkSoft }}>
                <FeedTimestamp dateTime={post.created_at} />
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
              <span>공유하기</span>
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
                <UserAvatar className="pd-comment-av" style={{ background: th.badgeBg }} px={2.1} />
                <div
                  className="pd-comment-bubble"
                  style={{ background: th.rowBg, borderColor: th.rowEdge }}
                >
                  <div className="pd-comment-head">
                    <b style={{ color: th.ink }}>{c.user_name}</b>
                    <FeedTimestamp
                      dateTime={c.created_at}
                      className="pd-comment-time"
                      style={{ color: th.inkFaint }}
                    />
                  </div>
                  <span style={{ color: th.inkSoft }}>{c.content}</span>
                </div>
              </div>

              {/* 캐릭터가 단 답글 (스레드) */}
              {c.replies.map((r) => (
                <div key={r.reply_id} className="pd-reply">
                  <CharacterAvatar
                    imageUrl={r.gen_img_url ?? postAuthorAvatarUrl}
                    name={r.character_name}
                    className="pd-comment-av"
                    style={{ color: th.badgeInk, background: th.badgeBg }}
                  />
                  <div
                    className="pd-comment-bubble"
                    style={{ background: th.badgeBg, borderColor: th.badgeBg }}
                  >
                    <div className="pd-comment-head">
                      <b style={{ color: th.ink }}>{r.character_name}</b>
                      <FeedTimestamp
                        dateTime={r.created_at}
                        className="pd-comment-time"
                        style={{ color: th.inkFaint }}
                      />
                    </div>
                    <span style={{ color: th.inkSoft }}>{r.content}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 댓글 게시 시 약 2분 뒤 서버가 캐릭터 답글을 예약 생성한다 */}
        {canComment ? (
          <div className="pd-ci">
            <UserAvatar className="pd-ci-av" style={{ background: th.badgeBg }} px={2.1} />
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
        ) : (
          <div className="pd-ci-blocked" style={{ color: th.inkSoft }}>
            {INACTIVE_AUTHOR_MESSAGE}
          </div>
        )}
      </div>

      {confirmOpen && (
        <div className="pd-confirm-backdrop" {...confirmBackdrop}>
          <div
            className="pd-confirm-card"
            style={{ background: th.cardBg, borderColor: th.modalEdge }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pd-confirm-title"
          >
            <div className="pd-confirm-icon" aria-hidden="true">
              <PixelSprite art={SPRITES.apple} palette={APPLE_PAL} px={3.4} />
            </div>
            <div id="pd-confirm-title" className="pd-confirm-title" style={{ color: th.ink }}>
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
                ref={confirmOkRef}
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
          share={buildPostShare(post.post_id, authorName, post.content, post.img_url)}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
