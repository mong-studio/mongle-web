type NoticeToastProps = {
  message: string;
  visible: boolean;
};

export function NoticeToast({ message, visible }: NoticeToastProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="noticeToast" role="status" aria-live="polite">
      <span aria-hidden="true">알림</span>
      <b>{message}</b>
    </div>
  );
}
