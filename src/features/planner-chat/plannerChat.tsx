import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useLayoutEffect, useRef, useState } from "react";
import "./plannerChat.css";
import type { TodoCommitResult } from "../todo/todoCreation.js";
import {
  chatTodos,
  groupPlannerDays,
  type PlannerDay,
  savePlannerTodos,
  type TodoGenerateResult,
} from "./plannerApi.js";

type PlannerMessage = {
  id: string;
  role: "chief" | "user";
  text: string;
  createdAt: number;
};

type PlannerChatProps = {
  onClose: () => void;
  onNotice: (message: string) => void;
  onTodosSaved: (result: TodoCommitResult) => void;
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

function formatMessageTime(createdAt: number) {
  return TIME_FORMATTER.format(new Date(createdAt));
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

// 이장님과 대화하기 입력은 공백 포함 최대 600자(백엔드 chat message max_length=600 와 일치).
const PLANNER_MESSAGE_MAX_LENGTH = 600;

function resizePlannerInput(inputElement: HTMLTextAreaElement | null) {
  if (!inputElement) {
    return;
  }
  inputElement.style.height = "54px";
  const nextHeight = Math.min(inputElement.scrollHeight, 92);
  inputElement.style.height = `${nextHeight}px`;
  inputElement.style.overflowY = inputElement.scrollHeight > 92 ? "auto" : "hidden";
}

function PlannerCloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

export function PlannerChat({ onClose, onNotice, onTodosSaved }: PlannerChatProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PlannerMessage[]>([
    {
      id: createId("msg"),
      role: "chief",
      text: "목표를 알려주면 기간, 우선순위, 반복 여부를 물어보고 플랜으로 정리할게.",
      createdAt: Date.now(),
    },
  ]);
  const [days, setDays] = useState<PlannerDay[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<TodoGenerateResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isWaitingForReply, setIsWaitingForReply] = useState(false);

  useLayoutEffect(() => {
    resizePlannerInput(inputRef.current);
  });

  useLayoutEffect(() => {
    const conversationElement = conversationRef.current;
    if (!conversationElement) {
      return;
    }
    conversationElement.scrollTop = conversationElement.scrollHeight;
  });

  async function sendPlannerMessage() {
    const message = input.trim();
    if (!message) {
      onNotice("플래너에게 목표나 고민을 한 문장으로 알려주세요.");
      return;
    }

    const nextMessages = [
      ...messages,
      { id: createId("msg"), role: "user" as const, text: message, createdAt: Date.now() },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsBusy(true);
    setIsWaitingForReply(true);

    try {
      const result = await chatTodos({
        message,
        thread_id: threadId,
      });
      if ("thread_id" in result && typeof result.thread_id === "string") {
        setThreadId(result.thread_id);
      }
      if (result.kind === "candidates") {
        setGeneratedPlan(result);
        setDays(groupPlannerDays(result));
        setMessages((current) => [
          ...current,
          {
            id: createId("msg"),
            role: "chief",
            text: result.summary_text || "실행 가능한 플랜으로 정리했어요.",
            createdAt: Date.now(),
          },
        ]);
        onNotice("플래너가 일자별 실행안을 만들었어요.");
      } else if (result.kind === "out_of_scope") {
        setMessages((current) => [
          ...current,
          {
            id: createId("msg"),
            role: "chief",
            text: result.message || "플래너로 도와드릴 수 있는 범위를 벗어났어요.",
            createdAt: Date.now(),
          },
        ]);
      } else {
        setMessages((current) => [
          ...current,
          {
            id: createId("msg"),
            role: "chief",
            text: result.question || "조금 더 구체적으로 알려주세요.",
            createdAt: Date.now(),
          },
        ]);
      }
    } catch {
      setDays([]);
      setGeneratedPlan(null);
      setMessages((current) => [
        ...current,
        {
          id: createId("msg"),
          role: "chief",
          text: "플랜을 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
          createdAt: Date.now(),
        },
      ]);
      onNotice("플래너 결과를 불러오지 못했어요.");
    } finally {
      setIsWaitingForReply(false);
      setIsBusy(false);
    }
  }

  async function savePlannerTasks() {
    if (!generatedPlan || generatedPlan.todos.length + generatedPlan.calendar_events.length === 0) {
      onNotice("저장할 플랜이 아직 없어요.");
      return;
    }

    setIsBusy(true);
    let shouldCloseAfterSave = false;
    try {
      const result = await savePlannerTodos({
        todos: generatedPlan.todos,
        calendar_events: generatedPlan.calendar_events,
      });
      const savedTodoItems = result.todos.map((todo) => ({
        id: todo.todo_id,
        title: todo.content,
        dueDate: todo.todo_date,
        tags: todo.tags,
        status: "saved" as const,
        assignedQuest: todo.quest
          ? {
              characterName: todo.quest.character_name,
              content: todo.quest.content,
            }
          : null,
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
                  characterName: todo.quest.character_name,
                  todoId: todo.todo_id,
                  todoTitle: todo.content,
                },
              ]
            : [],
        ),
        calendarEventCount: result.calendar_events.length,
      });
      setDays([]);
      setGeneratedPlan(null);
      setThreadId(null);
      setInput("");
      onNotice(
        `${savedTodoItems.length}개의 오늘 할 일과 ${result.calendar_events.length}개의 일정이 저장됐어요.`,
      );
      shouldCloseAfterSave = true;
    } catch (error) {
      onNotice(`플랜 저장 실패: ${error instanceof Error ? error.message : "원인 미상"}`);
    } finally {
      setIsBusy(false);
    }
    if (shouldCloseAfterSave) {
      onClose();
    }
  }

  return (
    <div className="plannerSheet plannerReplica">
      <div className="plannerOuterFrame">
        <button type="button" className="plannerCloseButton" onClick={onClose} aria-label="닫기">
          <PlannerCloseIcon />
        </button>
        <header className="plannerWoodTitle">
          <span className="plannerTitleFlower left" aria-hidden="true" />
          <h3>이장님과 대화하기</h3>
          <span className="plannerTitleFlower right" aria-hidden="true" />
        </header>

        <div className="plannerBookGrid">
          <aside className="plannerProfileCard" aria-label="이장님 소개">
            <div className="plannerPortraitFrame">
              <img
                className="plannerPortraitBg"
                src="/assets/dialogue/dialogue_background.png"
                alt=""
              />
              <img
                className="plannerPortraitChief"
                src="/assets/dialogue/dialogue_mongle.png"
                alt="이장님"
              />
              <strong className="plannerNamePlate">이장님</strong>
            </div>
            <p className="plannerProfileText">
              마을의 모든 일을 돌보고, 주민들과 함께 성장하는 마을 이장님이에요.
            </p>
            <section className="plannerProfilePlan" aria-label="챗봇이 생성한 플랜">
              <strong>생성된 플랜</strong>
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
                    </section>
                  ))}
                </div>
              ) : (
                <p>챗봇과 대화하면 이곳에 날짜별 플랜이 정리돼요.</p>
              )}
            </section>
          </aside>

          <section className="plannerChatCard" aria-label="이장님 대화">
            <div className="plannerConversation" ref={conversationRef}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`plannerMessageRow ${message.role === "user" ? "isUser" : "isChief"}`}
                >
                  {message.role === "chief" ? (
                    <div className="plannerChiefAvatarWrap">
                      <img
                        className="plannerChiefAvatar"
                        src="/assets/dialogue/dialogue_mongle.png"
                        alt="이장님"
                      />
                    </div>
                  ) : null}
                  <div className="plannerMessageStack">
                    {message.role === "chief" ? <strong>이장님</strong> : null}
                    <div
                      className={`plannerSpeech ${message.role === "user" ? "fromUser" : "fromChief"}`}
                    >
                      <p>{message.text}</p>
                    </div>
                    <time>{formatMessageTime(message.createdAt)}</time>
                  </div>
                </div>
              ))}
              {isWaitingForReply ? (
                <div className="plannerMessageRow isChief" aria-live="polite">
                  <div className="plannerChiefAvatarWrap">
                    <img
                      className="plannerChiefAvatar"
                      src="/assets/dialogue/dialogue_mongle.png"
                      alt="이장님"
                    />
                  </div>
                  <div className="plannerMessageStack">
                    <strong>이장님</strong>
                    <div className="plannerSpeech fromChief isLoading">
                      <span className="srOnly">답변 작성 중</span>
                      <span className="plannerTypingDots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="plannerComposer plannerReplicaComposer">
              <textarea
                ref={inputRef}
                value={input}
                maxLength={PLANNER_MESSAGE_MAX_LENGTH}
                onChange={(event) => {
                  setInput(event.target.value);
                  resizePlannerInput(event.currentTarget);
                }}
                onKeyDown={(event) => {
                  const nativeEvent = event.nativeEvent as KeyboardEvent & {
                    isComposing?: boolean;
                  };
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !nativeEvent.isComposing &&
                    nativeEvent.keyCode !== 229
                  ) {
                    event.preventDefault();
                    void sendPlannerMessage();
                  }
                }}
                placeholder="이장님께 메시지를 입력하세요..."
                rows={1}
              />
              <button
                type="button"
                className="plannerSendButton"
                onClick={() => void sendPlannerMessage()}
                disabled={isBusy}
              >
                <SendRoundedIcon aria-hidden="true" />
                {isBusy ? "정리 중" : "보내기"}
              </button>
            </div>

            <div className="plannerLedgerActions">
              <button
                type="button"
                className="plannerPrimaryAction"
                onClick={() => void savePlannerTasks()}
                disabled={isBusy || days.length === 0}
              >
                <AssignmentTurnedInRoundedIcon aria-hidden="true" />
                계획 저장
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
