import type { CalEvent } from "./calEngine.js";
import { CATS, catFromHex, ymdStrToSerial } from "./calEngine.js";

export type CalTodo = {
  todo_id: string;
  content: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  todo_date: string;
  tag_color: string;
  tag_content: string;
  tag_id?: number;
};

export type CalSchedule = {
  schedule_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  tag_color: string;
  tag_content: string;
  tag_id?: number;
};

export type CalTag = {
  tag_id: number;
  content: string;
  color: string;
};

export type TagItem = { id: number; content: string; color: string };

export function todoToEvent(t: CalTodo): CalEvent {
  const sr = ymdStrToSerial(t.todo_date);
  const cat = catFromHex(t.tag_color);
  const c = CATS[cat];
  return {
    id: `todo-${t.todo_id}`,
    title: t.content,
    short: t.content.slice(0, 8),
    done: t.status === "COMPLETED",
    s: sr,
    e: sr,
    color: t.tag_color || c.color,
    bg: t.tag_color ? `${t.tag_color}22` : c.bg, // 색상 코드 끝에 "22"를 붙이면 CSS가 이를 알파값으로 해석한다(16진수 22 = 약 13% 불투명도).
    tagLabel: t.tag_content ? `#${t.tag_content}` : `#${c.label}`,
    description: "",
    tagId: t.tag_id ?? null,
    todoId: t.todo_id,
  };
}

export function scheduleToEvent(s: CalSchedule): CalEvent {
  const sSr = ymdStrToSerial(s.start_date);
  const eSr = ymdStrToSerial(s.end_date ?? s.start_date);
  const cat = catFromHex(s.tag_color);
  const c = CATS[cat];
  return {
    id: `sched-${s.schedule_id}`,
    title: s.title,
    short: s.title.slice(0, 8),
    done: false,
    s: sSr,
    e: eSr,
    color: s.tag_color || c.color,
    bg: s.tag_color ? `${s.tag_color}22` : c.bg,
    tagLabel: s.tag_content ? `#${s.tag_content}` : `#${c.label}`,
    description: s.description,
    tagId: s.tag_id ?? null,
    scheduleId: s.schedule_id,
  };
}
