import { useState } from "react";
import "./plannerChat.css";
import {
  buildCommitPayload,
  groupPlannerDays,
  type PlannerDay,
  postWebJson,
  type TodoChatFollowUpResult,
  type TodoCommitResponse,
  type TodoGenerateResult,
} from "../todo/todoApi.js";
import type { TodoCommitResult } from "../todo/todoCreation.js";

type PlannerMessage = {
  id: string;
  role: "chief" | "user";
  text: string;
};

type PlannerChatProps = {
  apiBase: string;
  onNotice: (message: string) => void;
  onTodosSaved: (result: TodoCommitResult) => void;
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatPlannerDate(date: string) {
  const value = new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) {
    return date;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(value);
}

function buildPeriodLabel(days: PlannerDay[]) {
  if (days.length === 0) {
    return "대화 후 자동 정리";
  }
  if (days.length === 1) {
    return formatPlannerDate(days[0].date);
  }
  return `${formatPlannerDate(days[0].date)} ~ ${formatPlannerDate(days[days.length - 1].date)}`;
}

export function PlannerChat({ apiBase, onNotice, onTodosSaved }: PlannerChatProps) {
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PlannerMessage[]>([
    {
      id: createId("msg"),
      role: "chief",
      text: "목표를 알려주면 기간, 우선순위, 반복 여부를 물어보고 플랜으로 정리할게.",
    },
  ]);
  const [days, setDays] = useState<PlannerDay[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  const latestUserMessage = [...messages]
    .reverse()
    .find((message: PlannerMessage) => message.role === "user");
  const goalLabel = latestUserMessage?.text.slice(0, 26) || "이루고 싶은 일";

  function resetPlanner() {
    setDays([]);
    setThreadId(null);
    setInput("");
    setMessages([
      {
        id: createId("msg"),
        role: "chief",
        text: "목표가 흐릿해도 괜찮아요. 하고 싶은 일을 말해주면 날짜별로 차근차근 정리해드릴게요.",
      },
    ]);
  }

  async function sendPlannerMessage() {
    const message = input.trim();
    if (!message) {
      onNotice("플래너에게 목표나 고민을 한 문장으로 알려주세요.");
      return;
    }

    const nextMessages = [
      ...messages,
      { id: createId("msg"), role: "user" as const, text: message },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsBusy(true);

    try {
      const result = await postWebJson<TodoChatFollowUpResult | TodoGenerateResult>(
        apiBase,
        "/api/v1/todos/chat/",
        {
          message,
          thread_id: threadId,
        },
      );
      if ("thread_id" in result && typeof result.thread_id === "string") {
        setThreadId(result.thread_id);
      }
      if (result.kind === "candidates") {
        setDays(groupPlannerDays(result));
        setMessages((current) => [
          ...current,
          {
            id: createId("msg"),
            role: "chief",
            text: result.summary_text || "실행 가능한 플랜으로 정리했어요.",
          },
        ]);
        onNotice("플래너가 일자별 실행안을 만들었어요.");
      } else {
        setMessages((current) => [
          ...current,
          {
            id: createId("msg"),
            role: "chief",
            text: result.question || "조금 더 구체적으로 알려주세요.",
          },
        ]);
      }
    } catch {
      const fallbackDays = [
        {
          date: "2026-05-26",
          tasks: [
            {
              title: `${message.slice(0, 24)} 시작점 정리`,
              detail: "25분 안에 끝낼 수 있는 첫 작업으로 쪼개요.",
              tags: ["계획"],
            },
          ],
        },
      ];
      setDays(fallbackDays);
      setMessages((current) => [
        ...current,
        {
          id: createId("msg"),
          role: "chief",
          text: "AI API가 꺼져 있어 로컬 플랜으로 먼저 정리했어요.",
        },
      ]);
      onNotice("플래너 결과를 TODO로 저장할 수 있어요.");
    } finally {
      setIsBusy(false);
    }
  }

  async function savePlannerTasks() {
    const nextTodos = days.flatMap((day) =>
      day.tasks.map((task) => ({
        id: createId("todo"),
        title: task.title,
        dueDate: day.date,
        tags: task.tags ?? [],
        status: "saved" as const,
      })),
    );

    if (nextTodos.length === 0) {
      onNotice("저장할 플랜이 아직 없어요.");
      return;
    }

    setIsBusy(true);
    try {
      const result = await postWebJson<TodoCommitResponse>(
        apiBase,
        "/api/v1/todos/commit/",
        buildCommitPayload(nextTodos),
      );
      const savedTodoItems = result.todos.map((todo) => ({
        id: todo.todo_id,
        title: todo.content,
        dueDate: todo.todo_date,
        tags: todo.tags,
        status: "saved" as const,
      }));
      onTodosSaved({
        todos: savedTodoItems,
        questPreviews: result.todos.flatMap((todo) =>
          todo.quest
            ? [
                {
                  questId: todo.quest.quest_id,
                  content: todo.quest.content,
                  characterId: todo.quest.character_id,
                  todoId: todo.todo_id,
                  todoTitle: todo.content,
                },
              ]
            : [],
        ),
        calendarEventCount: result.calendar_events.length,
      });
      setDays([]);
      resetPlanner();
      onNotice(
        `${savedTodoItems.length}개의 오늘 할 일이 저장됐고 ${result.calendar_events.length}개의 일정이 반영됐어요.`,
      );
    } catch (error) {
      onNotice(`플랜 저장 실패: ${error instanceof Error ? error.message : "원인 미상"}`);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="plannerSheet plannerReplica">
      <div className="plannerOuterFrame">
        <header className="plannerHeroCard">
          <div className="plannerHeroCopy">
            <p className="plannerHeroKicker">✦ 몽글마을 계획상담소 ✦</p>
            <h3>이장님이 계획 장부를 펼쳤어요</h3>
            <p className="plannerHeroLead">
              이루고 싶은 일을 말해주면 날짜별로 차곡차곡 정리해드릴게요.
            </p>
          </div>
          <span className="bookmarkFlag" aria-hidden="true" />
        </header>

        <section className="plannerChatCard">
          <div className="plannerSectionHeading">이장님 상담소</div>
          <div className="plannerConversation">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`plannerMessageRow ${message.role === "user" ? "isUser" : "isChief"}`}
              >
                {message.role === "chief" ? (
                  <div className="plannerChiefAvatarWrap">
                    <img
                      className="plannerChiefAvatar"
                      src="/assets/mongle_chief.png"
                      alt="몽글마을 이장님"
                    />
                  </div>
                ) : null}
                <div
                  className={`plannerSpeech ${message.role === "user" ? "fromUser" : "fromChief"}`}
                >
                  <p>{message.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="plannerComposer plannerReplicaComposer">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void sendPlannerMessage();
                }
              }}
              placeholder="이장님께 하고 싶은 말을 입력해 주세요."
            />
            <button
              type="button"
              className="plannerSendButton"
              onClick={() => void sendPlannerMessage()}
              disabled={isBusy}
            >
              {isBusy ? "정리 중" : "보내기"}
            </button>
          </div>
        </section>

        <section className="plannerLedgerCard">
          <div className="plannerSectionHeading">이장님의 계획 장부</div>
          <div className="plannerLedgerMeta">
            <span>목표 {goalLabel}</span>
            <span>기간 {buildPeriodLabel(days)}</span>
            <span>상태 {days.length > 0 ? "대화 후 생성된 계획" : "아직 정리 전"}</span>
          </div>
          {days.length > 0 ? (
            <div className="plannerLedgerDays">
              {days.map((day, index) => (
                <section key={day.date} className="plannerLedgerDayCard">
                  <strong>
                    {index + 1}일차 · {formatPlannerDate(day.date)}
                  </strong>
                  <ul>
                    {day.tasks.slice(0, 2).map((task) => (
                      <li key={`${day.date}-${task.title}`}>
                        <span className="plannerTodoDot" aria-hidden="true" />
                        <b>{task.title}</b>
                      </li>
                    ))}
                  </ul>
                  {day.tasks.length > 2 ? (
                    <p className="plannerMoreTasks">+{day.tasks.length - 2}개 작업 더 있어요.</p>
                  ) : null}
                </section>
              ))}
            </div>
          ) : (
            <div className="plannerLedgerEmpty">
              <p>대화를 시작하면 아래 장부에 날짜별 실행안이 정리돼요.</p>
            </div>
          )}
          <div className="plannerLedgerFooter">
            <p>핵심 할 일만 간결하게 저장해서 오늘의 TODO로 넘겨드릴게요.</p>
            <div className="plannerLedgerActions">
              <button
                type="button"
                className="plannerPrimaryAction"
                onClick={() => void savePlannerTasks()}
                disabled={isBusy || days.length === 0}
              >
                계획 확정하기
              </button>
              <button type="button" className="plannerSecondaryAction" onClick={resetPlanner}>
                다시 조정하기
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
