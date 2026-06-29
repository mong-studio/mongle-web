import { describe, expect, it } from "vitest";
import { type CalEvent, canExtendTodo } from "./calEngine.js";

const TODAY = 100; // 임의의 오늘 serial
const PAST = TODAY - 5;
const FUTURE = TODAY + 5;

function todo(over: Partial<CalEvent>): CalEvent {
  return {
    id: "todo-1",
    title: "할일",
    short: "할일",
    done: false,
    failed: false,
    s: PAST,
    e: PAST,
    color: "#000",
    bg: "#fff",
    tagLabel: "#일상",
    todoId: "1",
    ...over,
  };
}

describe("canExtendTodo — 연장 버튼 노출 조건", () => {
  it("지난 실패(FAILED) 할일은 연장 가능 — 자동 실패·포기 모두 FAILED 상태", () => {
    expect(canExtendTodo(todo({ s: PAST, done: false, failed: true }), TODAY)).toBe(true);
  });

  it("지난 진행 중(자정 배치 전 잔여분)도 방어적으로 연장 가능", () => {
    expect(canExtendTodo(todo({ s: PAST, done: false, failed: false }), TODAY)).toBe(true);
  });

  it("지난 완료(COMPLETED) 할일은 연장 불가", () => {
    expect(canExtendTodo(todo({ s: PAST, done: true }), TODAY)).toBe(false);
  });

  it("오늘 할일은 연장 불가(지난 것만 대상)", () => {
    expect(canExtendTodo(todo({ s: TODAY }), TODAY)).toBe(false);
  });

  it("미래 할일은 연장 불가", () => {
    expect(canExtendTodo(todo({ s: FUTURE }), TODAY)).toBe(false);
  });

  it("일정(schedule)은 연장 대상이 아님", () => {
    expect(canExtendTodo(todo({ s: PAST, todoId: undefined, scheduleId: "s1" }), TODAY)).toBe(
      false,
    );
  });

  it("todoId 가 없으면 연장 불가", () => {
    expect(canExtendTodo(todo({ s: PAST, todoId: undefined }), TODAY)).toBe(false);
  });
});
