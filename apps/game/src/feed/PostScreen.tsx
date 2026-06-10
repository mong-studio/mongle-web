import type { ThemeTokens } from "./feedData.js";
import { MONGSIL, MONGSIL_POSTS } from "./feedData.js";
import { ImageSlot } from "./ImageSlot.js";

type LikeMap = Record<string, { count: number; liked: boolean }>;

interface PostScreenProps {
  postId: string;
  th: ThemeTokens;
  likes: LikeMap;
  onToggleLike: (id: string) => void;
  onBack: () => void;
  onOpenProfile: () => void;
}

export function PostScreen({
  postId,
  th,
  likes,
  onToggleLike,
  onBack,
  onOpenProfile,
}: PostScreenProps) {
  const post = MONGSIL_POSTS.find((p) => p.id === postId);
  if (!post) return null;

  const like = likes[post.id] ?? { count: post.hearts, liked: false };

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
        {/* post card */}
        <article className="pd-post" style={{ background: th.cardBg, borderColor: th.cardEdge }}>
          <button type="button" className="pd-author" onClick={onOpenProfile}>
            <div className="pd-avatar">🐑</div>
            <div className="pd-author-txt">
              <div className="pd-author-name" style={{ color: th.ink }}>
                {MONGSIL.name}
                <span className="pd-badge" style={{ background: th.badgeBg, color: th.badgeInk }}>
                  {MONGSIL.role}
                </span>
              </div>
              <div className="pd-author-meta" style={{ color: th.inkSoft }}>
                {post.time} · {post.location}
              </div>
            </div>
          </button>

          <div className="pd-img">
            <ImageSlot
              id={`pd-${post.id}`}
              placeholder={`${post.food} ${post.title}`}
              width="100%"
              height={240}
              tint={th.rowBg}
              radius={18}
            />
          </div>

          <div className="pd-body" style={{ color: th.ink }}>
            {post.body.split("\n").map((ln, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static body lines
              <p key={i}>{ln || " "}</p>
            ))}
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
              {post.quest}
            </div>
          </div>

          <div className="pd-meta" style={{ background: th.rowBg, borderColor: th.rowEdge }}>
            <div
              className="pd-meta-key"
              style={{ background: th.cardBg, borderColor: th.rowEdge, color: th.ink }}
            >
              <span className="pd-meta-ic" style={{ background: th.tagBg, color: th.tagInk }}>
                #
              </span>
              <span>해시태그</span>
            </div>
            <div className="pd-meta-val">
              <div className="pd-chips">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="pd-chip"
                    style={{ background: th.tagBg, color: th.tagInk }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <footer className="pd-foot" style={{ borderColor: th.cardEdge }}>
            <button
              type="button"
              className={`pd-react pd-heart${like.liked ? " on" : ""}`}
              onClick={() => onToggleLike(post.id)}
            >
              <svg
                aria-hidden="true"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={like.liked ? th.like : "none"}
                stroke={like.liked ? th.like : th.ink}
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20.5C12 20.5 3.5 15 3.5 8.8 3.5 6.1 5.6 4 8.2 4c1.7 0 3.1.9 3.8 2.2C12.7 4.9 14.1 4 15.8 4 18.4 4 20.5 6.1 20.5 8.8 20.5 15 12 20.5 12 20.5Z" />
              </svg>
              <span style={{ color: like.liked ? th.like : th.ink }}>{like.count}</span>
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
              <span>{post.commentList.length}</span>
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

        {/* comments */}
        <div className="pd-comments">
          <div className="pd-comments-h" style={{ color: th.ink }}>
            댓글 {post.commentList.length}
          </div>
          {post.commentList.length === 0 && (
            <div className="pd-comments-empty" style={{ color: th.inkSoft }}>
              아직 댓글이 없어요. 첫 따뜻한 한마디를 남겨보세요 🌷
            </div>
          )}
          {post.commentList.map((c, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static comment list
            <div key={i} className="pd-comment">
              <div className="pd-comment-av" style={{ color: th.tagInk }}>
                {c.who[0]}
              </div>
              <div
                className="pd-comment-bubble"
                style={{ background: th.rowBg, borderColor: th.rowEdge }}
              >
                <b style={{ color: th.ink }}>{c.who}</b>
                <span style={{ color: th.inkSoft }}>{c.text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* comment input */}
        <div className="pd-ci">
          <div className="pd-ci-av">🐑</div>
          <div
            className="pd-ci-field"
            style={{ background: th.rowBg, borderColor: th.rowEdge, color: th.inkSoft }}
          >
            따뜻한 댓글 남기기…
          </div>
          <button type="button" className="pd-ci-send" style={{ color: th.accent }}>
            게시
          </button>
        </div>
      </div>
    </div>
  );
}
