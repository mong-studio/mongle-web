import type { CSSProperties } from "react";

const ABSOLUTE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatAbsoluteTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const parts = Object.fromEntries(
    ABSOLUTE_FORMATTER.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
}

export function formatFeedTimestamp(isoString: string, now = Date.now()): string {
  const timestamp = new Date(isoString).getTime();
  if (Number.isNaN(timestamp)) return "";

  const elapsed = Math.max(0, now - timestamp);
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return formatAbsoluteTimestamp(isoString);
}

interface FeedTimestampProps {
  dateTime: string;
  className?: string;
  style?: CSSProperties;
}

export function FeedTimestamp({ dateTime, className, style }: FeedTimestampProps) {
  const absolute = formatAbsoluteTimestamp(dateTime);

  return (
    <time className={className} style={style} dateTime={dateTime} title={absolute}>
      {formatFeedTimestamp(dateTime)}
    </time>
  );
}
