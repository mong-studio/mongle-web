import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import WestRoundedIcon from "@mui/icons-material/WestRounded";
import { isAxiosError } from "axios";
import type { ClipboardEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  createReflection,
  fetchReflectionByDate,
  fetchReflectionContext,
  type ReflectionContextResponse,
  type ReflectionRecord,
  updateReflection,
} from "./api.js";
import "./ReflectionModal.css";

type ReflectionEntry = {
  id: string;
  date: string;
  good: string;
  regret: string;
};

type ReflectionTodo = {
  id: string;
  title: string;
  status: "candidate" | "saved" | "done";
  dueDate: string;
};

type ReflectionModalProps = {
  todos: ReflectionTodo[];
  tokenBalance: number;
  onRewardApples: (amount: number) => void;
  onNotice: (message: string) => void;
  onClose: () => void;
};

const EDIT_TOKEN_COST = 15;
const APPLE_REWARD_PER_FIELD = 2;
const REFLECTION_REWARD_MIN_LENGTH = 30;
const MAX_REFLECTION_LENGTH = 400;
const HISTORY_LOOKBACK_DAYS = 30;
const EMPTY_SERVER_FIELD_TEXT = "기록하지 않았어요.";
const DUMMY_HISTORY_ENTRY: ReflectionEntry = {
  id: "dummy-reflection-2026-05-15",
  date: "2026-05-15",
  good: "기획서 초안을 잘 정리해서 뿌듯했어요.\n헬스도 꾸준히 해서 몸이 가벼워졌어요.\n독서 시간을 챙겨서 마음이 여유로웠어요.",
  regret: "산책을 못 나가서 조금 아쉬웠어요.\n내일은 틈틈이 휴식도 챙겨야겠어요.",
};
const DIARY_ICONS = {
  apple: "/assets/icon/icon-apple.png",
  bear: "/assets/icon/bear.png",
  calendar: "/assets/icon/calendar.png",
  edit: "/assets/icon/edit.png",
  flower: "/assets/icon/flower.png",
  flowerWide: "/assets/icon/flower2.png",
  sprout: "/assets/icon/sprout.png",
  pencil: "/assets/icon/pencil.png",
} as const;

function formatKoreanDate(date: string) {
  const value = new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) {
    return date;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(value);
}

function getTodayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function normalizeReflection(record: ReflectionRecord): ReflectionEntry {
  return {
    id: record.reflection_id,
    date: record.reflection_date,
    good: record.good_points,
    regret: record.improvement_points,
  };
}

function normalizeContextTodos(context: ReflectionContextResponse): ReflectionTodo[] {
  return [
    ...context.completed_todos.map((todo) => ({
      id: todo.todo_id,
      title: todo.content,
      status: "done" as const,
      dueDate: todo.todo_date,
    })),
    ...context.incomplete_todos.map((todo) => ({
      id: todo.todo_id,
      title: todo.content,
      status: "saved" as const,
      dueDate: todo.todo_date,
    })),
  ];
}

function getApiErrorCode(error: unknown) {
  if (!isAxiosError(error)) {
    return null;
  }
  const data = error.response?.data;
  if (!data || typeof data !== "object") {
    return null;
  }
  const apiError = (data as { error?: unknown }).error;
  if (!apiError || typeof apiError !== "object") {
    return null;
  }
  const message = (apiError as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}

function toServerReflectionContent(value: string) {
  return value.trim() || EMPTY_SERVER_FIELD_TEXT;
}

function DiaryIcon({
  name,
  className = "",
}: {
  name: keyof typeof DIARY_ICONS;
  className?: string;
}) {
  return (
    <img
      className={`reflectionIcon reflectionIcon-${name} ${className}`.trim()}
      src={DIARY_ICONS[name]}
      alt=""
      aria-hidden="true"
    />
  );
}

export function ReflectionModal({
  todos,
  tokenBalance,
  onRewardApples,
  onNotice,
  onClose,
}: ReflectionModalProps) {
  const today = useMemo(() => getTodayIso(), []);
  const [entries, setEntries] = useState<ReflectionEntry[]>([]);
  const [contextTodos, setContextTodos] = useState<ReflectionTodo[] | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [good, setGood] = useState("");
  const [regret, setRegret] = useState("");
  const [_isEditing, setIsEditing] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [pendingEditEntry, setPendingEditEntry] = useState<ReflectionEntry | null>(null);
  const [contentPhase, setContentPhase] = useState<"idle" | "out" | "in">("idle");
  const [limitWarningField, setLimitWarningField] = useState<"good" | "regret" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const todayEntry = entries.find((entry) => entry.date === today);
  const editingEntry = editingEntryId
    ? (entries.find((entry) => entry.id === editingEntryId) ?? null)
    : null;
  const historyEntries = [...entries]
    .filter((entry) => entry.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date));
  const historyPageStart = Math.max(0, pageIndex - 1) * 2;
  const historyLeftEntry = historyEntries[historyPageStart];
  const historyRightEntry = historyEntries[historyPageStart + 1];
  const maxPageIndex = Math.ceil(historyEntries.length / 2);
  const matchingTodayTodos = todos.filter(
    (todo) => todo.dueDate === today && todo.status !== "candidate",
  );
  const todayTodos =
    contextTodos ??
    (matchingTodayTodos.length > 0
      ? matchingTodayTodos
      : todos.filter((todo) => todo.status !== "candidate"));
  const canSubmit = good.trim() || regret.trim();
  const isTodayPage = pageIndex === 0;
  const isEditingExistingEntry = Boolean(editingEntry);
  const isReadOnly = !isEditingExistingEntry && (Boolean(todayEntry) || !isTodayPage);
  const hasEnoughEditTokens = tokenBalance >= EDIT_TOKEN_COST;
  const expectedCreateReward =
    [good, regret].filter((value) => value.trim().length >= REFLECTION_REWARD_MIN_LENGTH).length *
    APPLE_REWARD_PER_FIELD;

  useEffect(() => {
    let ignore = false;

    async function loadReflectionData() {
      setIsLoading(true);
      try {
        const context = await fetchReflectionContext(today);
        if (ignore) {
          return;
        }

        const loadedEntries: ReflectionEntry[] = [];
        if (context.reflection) {
          const todayReflection = normalizeReflection(context.reflection);
          loadedEntries.push(todayReflection);
          setGood(todayReflection.good);
          setRegret(todayReflection.regret);
        }
        setContextTodos(normalizeContextTodos(context));

        const historyDates = Array.from({ length: HISTORY_LOOKBACK_DAYS }, (_, index) =>
          addDays(today, -(index + 1)),
        );
        const historyResults = await Promise.all(
          historyDates.map(async (date) => {
            try {
              return normalizeReflection(await fetchReflectionByDate(date));
            } catch (error) {
              if (getApiErrorCode(error) === "REFLECTION_NOT_FOUND") {
                return null;
              }
              throw error;
            }
          }),
        );
        if (ignore) {
          return;
        }

        const loadedHistoryEntries = historyResults.filter(
          (entry): entry is ReflectionEntry => entry !== null,
        );
        setEntries([
          ...loadedEntries,
          ...(loadedHistoryEntries.length > 0 ? loadedHistoryEntries : [DUMMY_HISTORY_ENTRY]),
        ]);
      } catch (error) {
        if (!ignore) {
          const code = getApiErrorCode(error);
          setEntries([DUMMY_HISTORY_ENTRY]);
          onNotice(
            code === "INVALID_TOKEN" || code === "AUTHENTICATION_FAILED"
              ? "로그인 후 회고를 불러올 수 있어요."
              : "회고 정보를 불러오지 못했어요.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadReflectionData();
    return () => {
      ignore = true;
    };
  }, [today, onNotice]);

  function hydrateForm(entry: ReflectionEntry) {
    setGood(entry.good);
    setRegret(entry.regret);
  }

  function requestEditReflection(entry: ReflectionEntry) {
    setPendingEditEntry(entry);
  }

  function startEditReflection(entry: ReflectionEntry) {
    if (tokenBalance < EDIT_TOKEN_COST) {
      onNotice(`회고 수정에는 사과 ${EDIT_TOKEN_COST}개가 필요해요.`);
      return;
    }
    hydrateForm(entry);
    setIsEditing(true);
    setEditingEntryId(entry.id);
    setPendingEditEntry(null);
  }

  function updateReflectionText(field: "good" | "regret", value: string) {
    const nextValue = value.slice(0, MAX_REFLECTION_LENGTH);
    if (field === "good") {
      setGood(nextValue);
    } else {
      setRegret(nextValue);
    }
    setLimitWarningField(value.length > MAX_REFLECTION_LENGTH ? field : null);
  }

  function warnIfTextLimitReached(field: "good" | "regret", event: FormEvent<HTMLTextAreaElement>) {
    const nativeEvent = event.nativeEvent as InputEvent;
    const textarea = event.currentTarget;
    const selectedLength = textarea.selectionEnd - textarea.selectionStart;
    if (
      nativeEvent.inputType.startsWith("insert") &&
      selectedLength === 0 &&
      textarea.value.length >= MAX_REFLECTION_LENGTH
    ) {
      setLimitWarningField(field);
    }
  }

  function handleReflectionPaste(
    field: "good" | "regret",
    event: ClipboardEvent<HTMLTextAreaElement>,
  ) {
    const textarea = event.currentTarget;
    const selectedLength = textarea.selectionEnd - textarea.selectionStart;
    const availableLength = MAX_REFLECTION_LENGTH - (textarea.value.length - selectedLength);
    if (event.clipboardData.getData("text").length > availableLength) {
      setLimitWarningField(field);
    }
  }

  async function saveReflection() {
    if (!canSubmit) {
      onNotice("잘한 점이나 아쉬운 점 중 하나를 적어주세요.");
      return;
    }

    if (good.length > MAX_REFLECTION_LENGTH || regret.length > MAX_REFLECTION_LENGTH) {
      onNotice("회고는 항목별 최대 400자까지 작성할 수 있어요.");
      return;
    }

    if (todayEntry && isTodayPage && !isEditingExistingEntry) {
      onNotice("오늘의 회고는 이미 작성했어요. 수정하려면 사과 15개가 필요해요.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        good_points: toServerReflectionContent(good),
        improvement_points: toServerReflectionContent(regret),
      };

      if (editingEntry) {
        const updated = await updateReflection(editingEntry.id, payload);
        const nextEntry = normalizeReflection({
          reflection_id: updated.reflection_id,
          reflection_date: updated.reflection_date,
          good_points: updated.good_points,
          improvement_points: updated.improvement_points,
        });
        setEntries((current) =>
          current.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry)),
        );
        setGood(nextEntry.good);
        setRegret(nextEntry.regret);
        onRewardApples(updated.reward);
        setIsEditing(false);
        setEditingEntryId(null);
        onNotice("회고를 다시 정리했어요. 사과 15개를 사용했어요.");
        return;
      }

      const created = await createReflection({
        reflection_date: today,
        ...payload,
      });
      const nextEntry = normalizeReflection({
        reflection_id: created.reflection_id,
        reflection_date: created.reflection_date,
        good_points: created.good_points,
        improvement_points: created.improvement_points,
      });
      setEntries((current) => {
        const withoutToday = current.filter((entry) => entry.date !== today);
        return [nextEntry, ...withoutToday];
      });
      setGood(nextEntry.good);
      setRegret(nextEntry.regret);
      setIsEditing(false);
      onRewardApples(created.token);
      onNotice(`오늘 회고가 저장됐어요. 사과 ${created.token}개를 받았어요.`);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === "REFLECTION_ALREADY_CONFIRMED") {
        onNotice("오늘의 회고는 이미 작성했어요. 다시 불러올게요.");
        const context = await fetchReflectionContext(today);
        if (context.reflection) {
          const nextEntry = normalizeReflection(context.reflection);
          setEntries((current) => {
            const withoutToday = current.filter((entry) => entry.date !== today);
            return [nextEntry, ...withoutToday];
          });
          setGood(nextEntry.good);
          setRegret(nextEntry.regret);
        }
        return;
      }
      if (code === "INSUFFICIENT_TOKEN_BALANCE") {
        onNotice(`회고 수정에는 사과 ${EDIT_TOKEN_COST}개가 필요해요.`);
        return;
      }
      if (code === "INVALID_REFLECTION_CONTENT") {
        onNotice("회고는 각 항목을 400자 이하로 작성해야 해요.");
        return;
      }
      onNotice("회고 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  function movePage(direction: "prev" | "next") {
    setIsEditing(false);
    setEditingEntryId(null);
    setPendingEditEntry(null);
    if (contentPhase !== "idle") {
      return;
    }

    const nextPage =
      direction === "prev" ? Math.max(0, pageIndex - 1) : Math.min(maxPageIndex, pageIndex + 1);
    if (nextPage === pageIndex) {
      return;
    }

    setContentPhase("out");
    window.setTimeout(() => {
      setPageIndex(nextPage);
      setContentPhase("in");
      window.setTimeout(() => setContentPhase("idle"), 280);
    }, 190);
  }

  const readOnlyEntry = isTodayPage ? todayEntry : editingEntry;
  const goodValue = isReadOnly && readOnlyEntry ? readOnlyEntry.good : good;
  const regretValue = isReadOnly && readOnlyEntry ? readOnlyEntry.regret : regret;
  const goodLimitWarning = limitWarningField === "good";
  const regretLimitWarning = limitWarningField === "regret";
  const canSaveReflection = Boolean(canSubmit);
  const dateLabel = formatKoreanDate(today);
  const completedCount = todayTodos.filter((todo) => todo.status === "done").length;
  const incompleteCount = todayTodos.length - completedCount;

  function renderHistoryEntry(entry: ReflectionEntry) {
    return (
      <article className="reflectionHistoryEntry">
        <div className="reflectionHistoryDate">
          <DiaryIcon name="calendar" />
          <strong>{formatKoreanDate(entry.date)}</strong>
          <button
            type="button"
            className="reflectionInlineEditButton"
            onClick={() => requestEditReflection(entry)}
            disabled={isLoading || isSaving}
          >
            <DiaryIcon name="pencil" />
            수정
          </button>
        </div>

        <section className="reflectionHistoryEssay">
          <h3>
            <DiaryIcon name="sprout" />
            잘한 점
          </h3>
          <div className="reflectionHistoryTextBox">
            <p className="reflectionHistoryText">{entry.good || "기록된 내용이 없어요."}</p>
          </div>
        </section>

        <section className="reflectionHistoryEssay">
          <h3>
            <DiaryIcon name="sprout" />
            아쉬운 점
          </h3>
          <div className="reflectionHistoryTextBox">
            <p className="reflectionHistoryText">{entry.regret || "기록된 내용이 없어요."}</p>
          </div>
        </section>
      </article>
    );
  }

  function renderReflectionEditor() {
    return (
      <section className="reflectionRightPage" aria-label="회고 작성">
        <article className="reflectionEssayCard reflectionEssayGood">
          <div className="reflectionEssayHeader">
            <h3>
              <DiaryIcon name="sprout" />
              잘한 점
            </h3>
            <span className={`reflectionFieldMeta ${goodLimitWarning ? "isLimitWarning" : ""}`}>
              <small>{goodValue.length}/400</small>
              <span className="reflectionLimitMessage" aria-live="polite">
                {goodLimitWarning ? "최대 400자까지 입력 가능해요." : ""}
              </span>
            </span>
          </div>
          <label className={`reflectionField ${goodLimitWarning ? "isLimitWarning" : ""}`}>
            <textarea
              value={goodValue}
              maxLength={MAX_REFLECTION_LENGTH}
              onBeforeInput={(event) => warnIfTextLimitReached("good", event)}
              onChange={(event) => updateReflectionText("good", event.target.value)}
              onPaste={(event) => handleReflectionPaste("good", event)}
              placeholder="오늘 나에게 칭찬해주고 싶은 일을 적어주세요."
              disabled={isReadOnly}
            />
          </label>
        </article>

        <article className="reflectionEssayCard reflectionEssayRegret">
          <div className="reflectionEssayHeader">
            <h3>
              <DiaryIcon name="sprout" />
              아쉬운 점
            </h3>
            <span className={`reflectionFieldMeta ${regretLimitWarning ? "isLimitWarning" : ""}`}>
              <small>{regretValue.length}/400</small>
              <span className="reflectionLimitMessage" aria-live="polite">
                {regretLimitWarning ? "최대 400자까지 입력 가능해요." : ""}
              </span>
            </span>
          </div>
          <label className={`reflectionField ${regretLimitWarning ? "isLimitWarning" : ""}`}>
            <textarea
              value={regretValue}
              maxLength={MAX_REFLECTION_LENGTH}
              onBeforeInput={(event) => warnIfTextLimitReached("regret", event)}
              onChange={(event) => updateReflectionText("regret", event.target.value)}
              onPaste={(event) => handleReflectionPaste("regret", event)}
              placeholder="다음에는 다르게 해보고 싶은 점을 적어주세요."
              disabled={isReadOnly}
            />
          </label>
        </article>
      </section>
    );
  }

  function renderEmptyHistoryPage() {
    return (
      <article className="reflectionEmptyHistory">
        <div className="reflectionEmptySprout" aria-hidden="true">
          <DiaryIcon name="sprout" />
        </div>
        <strong>아직 회고가 채워지지 않았어요</strong>
        <p>다음 회고를 기다리고 있어요.</p>
        <span aria-hidden="true">
          <DiaryIcon name="flower" />
        </span>
      </article>
    );
  }

  return (
    <div className="reflectionBook" role="document" aria-label="오늘의 회고 일기">
      <img
        className="reflectionBookBg"
        src="/assets/reflection/reflection-diary.png"
        alt=""
        aria-hidden="true"
      />

      <button type="button" className="reflectionBookClose" onClick={onClose} aria-label="닫기">
        <CloseRoundedIcon aria-hidden="true" />
      </button>

      <div
        key={`content-${pageIndex}`}
        className={`reflectionContentLayer reflectionContentLayer-${contentPhase}`}
      >
        {isLoading ? <div className="reflectionLoadingState">회고를 불러오고 있어요...</div> : null}
        {isTodayPage ? (
          <>
            <section className="reflectionLeftPage" aria-label="회고 요약">
              <header className="reflectionTitle">
                <DiaryIcon name="calendar" />
                <div>
                  <h3>오늘 하루를 천천히 돌아봐요</h3>
                </div>
                <DiaryIcon name="flower" className="reflectionTitleFlower" />
              </header>

              <div className="reflectionDateCard">
                <DiaryIcon name="calendar" />
                <strong>{dateLabel}</strong>
                <DiaryIcon name="flowerWide" />
              </div>

              <section className="reflectionTodoCard" aria-label="오늘의 TODO">
                <div className="reflectionTodoHead">
                  <h3>
                    <DiaryIcon name="sprout" />
                    오늘의 TODO
                  </h3>
                  <p>
                    <span>완료 {completedCount}</span>
                    <span>미완료 {incompleteCount}</span>
                  </p>
                </div>
                <ul className="reflectionTodoList">
                  {todayTodos.slice(0, 4).map((todo) => {
                    const done = todo.status === "done";
                    return (
                      <li key={todo.id}>
                        <span className={`reflectionCheck ${done ? "isDone" : ""}`}>
                          {done ? "✓" : ""}
                        </span>
                        <strong>{todo.title}</strong>
                        <em className={done ? "isDone" : ""}>{done ? "완료" : "미완료"}</em>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="reflectionRewardCard" aria-label="회고 보상 안내">
                <div>
                  <DiaryIcon name="apple" />
                  <p>
                    <strong>회고 작성 보상</strong>
                    30자 이상 작성한 항목 1개당 사과 {APPLE_REWARD_PER_FIELD}개 지급!
                  </p>
                  <b>
                    <DiaryIcon name="apple" />+ {expectedCreateReward}{" "}
                  </b>
                </div>
                <div>
                  <DiaryIcon name="edit" />
                  <p>
                    <strong>회고 완료 후 수정은</strong>
                    사과 15개를 지불해야 수정할 수 있어요.
                  </p>
                  <b>
                    <DiaryIcon name="apple" />- 15
                  </b>
                </div>
                <small>보유 사과 {tokenBalance}개</small>
              </section>
            </section>

            {renderReflectionEditor()}
          </>
        ) : editingEntry ? (
          <>
            <section className="reflectionLeftPage" aria-label="수정할 회고 안내">
              <header className="reflectionTitle">
                <DiaryIcon name="calendar" />
                <div>
                  <h3>회고를 다시 정리해요</h3>
                </div>
                <DiaryIcon name="flower" className="reflectionTitleFlower" />
              </header>

              <div className="reflectionDateCard">
                <DiaryIcon name="calendar" />
                <strong>{formatKoreanDate(editingEntry.date)}</strong>
                <DiaryIcon name="flowerWide" />
              </div>

              <section className="reflectionEditGuideCard" aria-label="회고 수정 안내">
                <DiaryIcon name="edit" />
                <h3>회고 수정 안내</h3>
                <p>수정 후 저장하면 사과 {EDIT_TOKEN_COST}개가 차감돼요.</p>
                <div>
                  <DiaryIcon name="apple" />
                  <strong>- {EDIT_TOKEN_COST}</strong>
                </div>
                <small>보유 사과 {tokenBalance}개</small>
              </section>
            </section>

            {renderReflectionEditor()}
          </>
        ) : (
          <>
            <section className="reflectionHistoryPage reflectionHistoryLeftPage">
              <header className="reflectionHistoryTitle">
                <DiaryIcon name="flower" />
                <DiaryIcon name="calendar" />
                <h3>이전 회고 보기</h3>
                <DiaryIcon name="flowerWide" />
              </header>
              {historyLeftEntry ? renderHistoryEntry(historyLeftEntry) : renderEmptyHistoryPage()}
            </section>

            <section className="reflectionHistoryPage reflectionHistoryRightPage">
              {historyRightEntry ? renderHistoryEntry(historyRightEntry) : renderEmptyHistoryPage()}
            </section>
          </>
        )}

        {todayEntry && !isEditingExistingEntry && isTodayPage ? (
          <button
            type="button"
            className="reflectionEditButton"
            onClick={() => requestEditReflection(todayEntry)}
          >
            <DiaryIcon name="pencil" />
            수정하기
          </button>
        ) : null}

        {isTodayPage || editingEntry ? (
          <div className="reflectionActions">
            <button
              type="button"
              className="reflectionPrimaryButton"
              onClick={saveReflection}
              disabled={isReadOnly || !canSaveReflection || isSaving || isLoading}
            >
              {isSaving ? "저장 중" : isEditingExistingEntry ? "수정 완료" : "작성 완료"}
            </button>
          </div>
        ) : null}
      </div>

      {pendingEditEntry ? (
        <div className="reflectionConfirmBackdrop" role="presentation">
          <section className="reflectionEditConfirm" role="alertdialog" aria-modal="true">
            <DiaryIcon name="bear" className="reflectionConfirmBear" />
            <h3>회고를 수정할까요?</h3>
            <p>수정하면 사과(토큰) {EDIT_TOKEN_COST}개가 차감돼요.</p>
            <div className="reflectionConfirmCost">
              <DiaryIcon name="apple" />
              <strong>{EDIT_TOKEN_COST}</strong>
            </div>
            <small>수정 후 저장하면 차감됩니다.</small>
            {!hasEnoughEditTokens ? (
              <p className="reflectionConfirmWarning" aria-live="polite">
                보유 사과가 부족해요. 현재 {tokenBalance}개를 가지고 있어요.
              </p>
            ) : null}
            <div className="reflectionConfirmActions">
              <button type="button" onClick={() => setPendingEditEntry(null)}>
                취소
              </button>
              <button
                type="button"
                onClick={() => startEditReflection(pendingEditEntry)}
                disabled={!hasEnoughEditTokens}
              >
                수정하기
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <button
        type="button"
        className="reflectionArrow reflectionArrowPrev"
        onClick={() => movePage("prev")}
        disabled={pageIndex === 0 || isEditingExistingEntry}
        aria-label="이전 회고 보기"
      >
        <WestRoundedIcon aria-hidden="true" />
      </button>
      <button
        type="button"
        className="reflectionArrow reflectionArrowNext"
        onClick={() => movePage("next")}
        disabled={pageIndex >= maxPageIndex || isEditingExistingEntry}
        aria-label="다음 회고 보기"
      >
        <EastRoundedIcon aria-hidden="true" />
      </button>
    </div>
  );
}
