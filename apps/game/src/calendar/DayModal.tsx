import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import type { CalHook } from "./CalendarCore.js";
import { Check, Tag } from "./CalendarCore.js";
import { serial, serialToMD, toYMDStr, WD, ymdStrToSerial } from "./calEngine.js";
import type { TagItem } from "./types.js";

const TAG_COLORS = [
  "#8478C0",
  "#62A256",
  "#5790C4",
  "#CF7E97",
  "#D9943C",
  "#E06060",
  "#40A080",
  "#A07848",
  "#7C7C9C",
  "#5AA4A0",
];

const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const staggerItem = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.16 } },
};

type DayModalProps = {
  ymd: { y: number; m: number; d: number } | null;
  cal: CalHook;
  onClose: () => void;
  onToggle: (id: string) => void;
  tags: TagItem[];
  onAddEvent: (
    title: string,
    tagId: number | null,
    newTag: { name: string; color: string } | null,
    startStr: string,
    endStr: string,
  ) => Promise<void>;
};

export function DayModal({ ymd, cal, onClose, onToggle, tags, onAddEvent }: DayModalProps) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#8478C0");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { selAdd } = cal;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only on ymd/selAdd change to reset form
  useEffect(() => {
    if (!ymd) return;
    setAdding(!!selAdd);
    setTitle("");
    setSelectedTagId(tags[0]?.id ?? null);
    setIsCreatingTag(tags.length === 0);
    setNewTagName("");
    setNewTagColor("#8478C0");
    const s = toYMDStr(ymd.y, ymd.m, ymd.d);
    setStart(s);
    setEnd(s);
  }, [ymd, selAdd]);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  if (!ymd) return null;
  const { y, m, d } = ymd;
  const wd = new Date(y, m, d).getDay();
  const evs = cal.getEvents(y, m, d);
  const total = evs.length;
  const doneCount = evs.filter((e) => cal.done.has(e.id)).length;
  const isToday = cal.todaySr === serial(y, m, d);

  const submit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const tagId = isCreatingTag ? null : selectedTagId;
      const newTag = isCreatingTag
        ? { name: newTagName.trim() || "태그", color: newTagColor }
        : null;
      await onAddEvent(title.trim(), tagId, newTag, start, end);
      setTitle("");
      setIsCreatingTag(tags.length === 0);
      setNewTagName("");
      inputRef.current?.focus();
    } finally {
      setSaving(false);
    }
  };

  const backdrop: CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 26,
    background: "rgba(70,48,22,0.34)",
    backdropFilter: "blur(3px)",
  };
  const panel: CSSProperties = {
    width: "100%",
    maxWidth: 472,
    maxHeight: "100%",
    display: "flex",
    flexDirection: "column",
    background: "var(--cream-1)",
    borderRadius: "var(--r-xl)",
    border: "2px solid var(--line)",
    boxShadow: "var(--sh-pop)",
    overflow: "hidden",
  };
  const itemRow: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    background: "var(--cream-0)",
    borderRadius: "var(--r-md)",
    border: "1.5px solid var(--line-soft)",
    cursor: "pointer",
    boxShadow: "var(--sh-card)",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={backdrop}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-modal-title"
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 24, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={panel}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "17px 19px 15px" }}>
          <span
            style={{
              width: 50,
              height: 50,
              flex: "0 0 auto",
              borderRadius: 16,
              background: isToday ? "var(--accent)" : "var(--cream-2)",
              border: `2px solid ${isToday ? "var(--accent-deep)" : "var(--line)"}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              boxShadow: "inset 0 -2px 0 rgba(0,0,0,.10)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 11,
                color: isToday ? "rgba(255,255,255,.85)" : "var(--ink-3)",
              }}
            >
              {m + 1}월
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 23,
                color: isToday ? "#fff" : "var(--ink-1)",
                marginTop: 1,
              }}
            >
              {d}
            </span>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              id="day-modal-title"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                color: "var(--ink-1)",
                lineHeight: 1.1,
              }}
            >
              {m + 1}월 {d}일{" "}
              <span
                style={{
                  color: wd === 0 ? "var(--sun)" : wd === 6 ? "var(--sat)" : "var(--ink-3)",
                }}
              >
                ({WD[wd]})
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "var(--ink-2)",
                marginTop: 3,
              }}
            >
              {isToday ? "오늘의 일정 · " : "몽글마을 일정 · "}
              {total > 0 ? `${doneCount}/${total} 완료` : "일정 없음"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              flex: "0 0 auto",
              borderRadius: 12,
              cursor: "pointer",
              border: "2px solid var(--line)",
              background: "var(--cream-0)",
              color: "var(--ink-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "2px 19px 10px", overflowY: "auto", flex: "1 1 auto" }}>
          {total === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "28px 0",
                color: "var(--ink-3)",
                fontFamily: "var(--font-body)",
                fontSize: 15,
              }}
            >
              아직 등록된 일정이 없어요
            </div>
          ) : (
            <motion.div
              style={{ display: "flex", flexDirection: "column", gap: 9 }}
              initial="hidden"
              animate="show"
              variants={staggerContainer}
            >
              {evs.map((e) => {
                const on = cal.done.has(e.id);
                const { m: sm, d: sd } = serialToMD(e.s);
                const { m: em, d: ed } = serialToMD(e.e);
                return (
                  <motion.div
                    key={e.id}
                    variants={staggerItem}
                    role="button"
                    tabIndex={0}
                    onClick={() => onToggle(e.id)}
                    onKeyDown={(ev) => ev.key === "Enter" && onToggle(e.id)}
                    style={itemRow}
                  >
                    <Check on={on} onClick={() => onToggle(e.id)} />
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        flex: "0 0 auto",
                        background: e.color,
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          flex: "1 1 auto",
                          minWidth: 0,
                          fontFamily: "var(--font-display)",
                          fontSize: 17,
                          color: on ? "var(--ink-3)" : "var(--ink-1)",
                          textDecoration: on ? "line-through" : "none",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {e.title}
                      </div>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 7, flex: "0 0 auto" }}
                      >
                        {e.s !== e.e && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              padding: "2px 9px",
                              borderRadius: 999,
                              background: "var(--cream-2)",
                              color: "var(--ink-2)",
                              fontFamily: "var(--font-display)",
                              fontSize: 12,
                              whiteSpace: "nowrap",
                            }}
                          >
                            📅 {sm + 1}/{sd}–{em + 1}/{ed}
                          </span>
                        )}
                        <Tag color={e.color} bg={e.bg} label={e.tagLabel} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        <div style={{ padding: "8px 19px 19px", flex: "0 0 auto" }}>
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "var(--r-lg)",
                cursor: "pointer",
                border: "2px dashed var(--line)",
                background: "var(--cream-0)",
                color: "var(--ink-2)",
                fontFamily: "var(--font-display)",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>＋</span> 할일 추가
            </button>
          ) : (
            <div
              style={{
                background: "var(--cream-0)",
                border: "2px solid var(--line)",
                borderRadius: "var(--r-lg)",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <input
                ref={inputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submit();
                  if (e.key === "Escape") setAdding(false);
                }}
                placeholder="무엇을 할까요?"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "11px 14px",
                  borderRadius: "var(--r-md)",
                  border: "2px solid var(--line-soft)",
                  background: "var(--cream-1)",
                  color: "var(--ink-1)",
                  fontFamily: "var(--font-display)",
                  fontSize: 17,
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {tags.map((t) => {
                  const isSel = !isCreatingTag && selectedTagId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTagId(t.id);
                        setIsCreatingTag(false);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        cursor: "pointer",
                        fontFamily: "var(--font-display)",
                        fontSize: 13,
                        whiteSpace: "nowrap",
                        border: isSel ? `2px solid ${t.color}` : "2px solid var(--line-soft)",
                        background: isSel ? `${t.color}22` : "var(--cream-0)",
                        color: isSel ? t.color : "var(--ink-3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        transition: "all .14s",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: t.color,
                          flexShrink: 0,
                        }}
                      />
                      #{t.content}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTag(true);
                    setSelectedTagId(null);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontFamily: "var(--font-display)",
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    border: isCreatingTag
                      ? "2px solid var(--accent)"
                      : "2px dashed var(--line-soft)",
                    background: isCreatingTag ? "var(--accent-tint)" : "var(--cream-0)",
                    color: isCreatingTag ? "var(--accent-deep)" : "var(--ink-3)",
                    transition: "all .14s",
                  }}
                >
                  ＋ 새 태그
                </button>
              </div>
              {isCreatingTag && (
                <div
                  style={{
                    padding: "11px 12px",
                    background: "var(--cream-1)",
                    borderRadius: "var(--r-md)",
                    border: "1.5px solid var(--line-soft)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 9,
                  }}
                >
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="태그 이름"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px 11px",
                      borderRadius: "var(--r-md)",
                      border: "2px solid var(--line-soft)",
                      background: "var(--cream-0)",
                      color: "var(--ink-1)",
                      fontFamily: "var(--font-display)",
                      fontSize: 15,
                      outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {TAG_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewTagColor(c)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: c,
                          border:
                            newTagColor === c ? "3px solid var(--ink-1)" : "2px solid transparent",
                          outline: newTagColor === c ? `2px solid ${c}` : "none",
                          outlineOffset: 2,
                          cursor: "pointer",
                          padding: 0,
                          flexShrink: 0,
                        }}
                      />
                    ))}
                    <label
                      title="직접 색상 선택"
                      style={{
                        position: "relative",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        overflow: "hidden",
                        flexShrink: 0,
                        cursor: "pointer",
                        border: "2px solid var(--line-soft)",
                      }}
                    >
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        style={{
                          position: "absolute",
                          opacity: 0,
                          inset: 0,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      />
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
                        }}
                      />
                    </label>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: newTagColor,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 13,
                        color: "var(--ink-2)",
                      }}
                    >
                      #{newTagName.trim() || "새태그"} 미리보기
                    </span>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 15,
                      color: "var(--ink-2)",
                      flexShrink: 0,
                    }}
                  >
                    기간
                  </span>
                  <input
                    type="date"
                    value={start}
                    max={end || undefined}
                    onChange={(e) => {
                      const v = e.target.value;
                      setStart(v);
                      if (v && end && v > end) setEnd(v);
                    }}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 14,
                      color: "var(--ink-1)",
                      padding: "8px 11px",
                      borderRadius: "var(--r-md)",
                      border: "2px solid var(--line-soft)",
                      background: "var(--cream-1)",
                      outline: "none",
                      cursor: "pointer",
                      flex: 1,
                      minWidth: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 15,
                      color: "var(--ink-3)",
                      flexShrink: 0,
                    }}
                  >
                    ~
                  </span>
                  <input
                    type="date"
                    value={end}
                    min={start || undefined}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEnd(v);
                      if (v && start && v < start) setStart(v);
                    }}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 14,
                      color: "var(--ink-1)",
                      padding: "8px 11px",
                      borderRadius: "var(--r-md)",
                      border: "2px solid var(--line-soft)",
                      background: "var(--cream-1)",
                      outline: "none",
                      cursor: "pointer",
                      flex: 1,
                      minWidth: 0,
                    }}
                  />
                </div>
                {start && end && start !== end && (
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: "var(--ink-3)",
                      paddingLeft: 2,
                    }}
                  >
                    {ymdStrToSerial(end) - ymdStrToSerial(start) + 1}일간 🐌
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 9 }}>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "var(--r-md)",
                    cursor: "pointer",
                    border: "2px solid var(--line)",
                    background: "var(--cream-1)",
                    color: "var(--ink-2)",
                    fontFamily: "var(--font-display)",
                    fontSize: 15,
                  }}
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={!title.trim() || saving}
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: "var(--r-md)",
                    cursor: title.trim() && !saving ? "pointer" : "default",
                    border: "none",
                    background: title.trim() ? "var(--accent)" : "var(--accent-soft)",
                    color: title.trim() ? "#fff" : "var(--ink-3)",
                    boxShadow: title.trim() ? "inset 0 -3px 0 rgba(0,0,0,.13)" : "none",
                    fontFamily: "var(--font-display)",
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {saving ? "추가 중..." : "추가하기"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
