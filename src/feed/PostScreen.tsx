import { useEffect, useState } from "react";
import { type ApiPost, fetchPostDetail } from "./api.js";
import type { ThemeTokens } from "./feedData.js";
import { ImageSlot } from "./ImageSlot.js";

interface PostScreenProps {
  postId: string;
  th: ThemeTokens;
  onBack: () => void;
  onOpenProfile: () => void;
}

export function PostScreen({ postId, th, onBack, onOpenProfile }: PostScreenProps) {
  const [post, setPost] = useState<ApiPost | null>(null);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postError, setPostError] = useState(false);

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
            <div className="pd-avatar">{post.character[0]?.toUpperCase() ?? "?"}</div>
            <div className="pd-author-txt">
              <div className="pd-author-name" style={{ color: th.ink }}>
                {post.character.slice(0, 8)}
              </div>
              <div className="pd-author-meta" style={{ color: th.inkSoft }}>
                {new Date(post.created_at).toLocaleDateString("ko-KR")}
              </div>
            </div>
          </button>

          <div className="pd-img">
            <ImageSlot
              id={`pd-${post.post_id}`}
              placeholder={post.img_url || "이미지"}
              width="100%"
              height={240}
              tint={th.rowBg}
              radius={18}
            />
          </div>

          <div className="pd-body" style={{ color: th.ink }}>
            <p>{post.content}</p>
          </div>

          <div className="pd-meta" style={{ background: th.rowBg, borderColor: th.rowEdge }}>
            <div
              className="pd-meta-key"
              style={{ background: th.cardBg, borderColor: th.rowEdge, color: th.ink }}
            >
              <span className="pd-meta-ic" style={{ background: th.badgeBg }}>
                📋
              </span>
              <span>퀘스트</span>
            </div>
            <div className="pd-meta-val" style={{ color: th.ink }}>
              {post.quest_id}
            </div>
          </div>

          <footer className="pd-foot" style={{ borderColor: th.cardEdge }}>
            <button
              type="button"
              className={`pd-react pd-heart${liked ? " on" : ""}`}
              onClick={() => setLiked((v) => !v)}
            >
              <svg
                aria-hidden="true"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={liked ? th.like : "none"}
                stroke={liked ? th.like : th.ink}
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20.5C12 20.5 3.5 15 3.5 8.8 3.5 6.1 5.6 4 8.2 4c1.7 0 3.1.9 3.8 2.2C12.7 4.9 14.1 4 15.8 4 18.4 4 20.5 6.1 20.5 8.8 20.5 15 12 20.5 12 20.5Z" />
              </svg>
            </button>

            <button type="button" className="pd-react" style={{ color: th.ink }}>
              <svg
                aria-hidden="true"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={th.ink}
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 11.5c0 4-3.9 7-8.5 7-1 0-2-.1-2.9-.4L4 19.5l1.3-3.4C4.2 14.9 3.5 13.3 3.5 11.5c0-4 3.9-7 8.5-7s9 3 9 7Z" />
              </svg>
              <span>{post.comments.length}</span>
            </button>

            <div style={{ flex: 1 }} />

            <button type="button" className="pd-react" style={{ color: th.accent }}>
              <svg
                aria-hidden="true"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={th.accent}
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12.5 20 5l-3 15-5.5-5.5L8 17l.2-4.3Z" />
                <path d="m11.5 14.5 5.5-9.5" />
              </svg>
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
            <div key={c.comment_id} className="pd-comment">
              <div className="pd-comment-av" style={{ color: th.tagInk }}>
                {c.user[0]?.toUpperCase() ?? "?"}
              </div>
              <div
                className="pd-comment-bubble"
                style={{ background: th.rowBg, borderColor: th.rowEdge }}
              >
                <b style={{ color: th.ink }}>{c.user}</b>
                <span style={{ color: th.inkSoft }}>{c.content}</span>
              </div>
            </div>
          ))}
        </div>

        {/* TODO: wire createComment API — 유저가 댓글 입력 시 10분 뒤 캐릭터 답글 예약 */}
        <div className="pd-ci">
          <div className="pd-ci-av">?</div>
          <input
            className="pd-ci-field"
            style={{ background: th.rowBg, borderColor: th.rowEdge, color: th.ink }}
            placeholder="따뜻한 댓글 남기기…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button type="button" className="pd-ci-send" style={{ color: th.accent }}>
            게시
          </button>
        </div>
      </div>
    </div>
  );
}
