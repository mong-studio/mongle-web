export type ApiEnvelope<T> = {
  status: string;
  result: T;
  error: unknown;
};

export type TaskCandidatePayload = {
  title: string;
  due_date: string;
  tags?: string[];
};

export type TodoGenerateResult = {
  kind: "candidates";
  thread_id: string;
  todos: TaskCandidatePayload[];
  calendar_events: TaskCandidatePayload[];
  summary_text?: string | null;
};

export type TodoChatFollowUpResult = {
  kind: "follow_up";
  thread_id: string;
  question: string;
  missing_aspects: string[];
};

export type PlannerDay = {
  date: string;
  tasks: {
    title: string;
    detail?: string;
    tags?: string[];
  }[];
};

export type TodoCommitResponse = {
  todos: {
    todo_id: string;
    content: string;
    todo_date: string;
    tags: string[];
    quest?: {
      quest_id: string;
      content: string;
      character_id: string;
    } | null;
  }[];
  calendar_events: {
    schedule_id: string;
    title: string;
    start_date: string;
    end_date?: string | null;
    tags: string[];
  }[];
  quest_distribution_triggered?: boolean;
};

export function formatTodayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function buildCommitPayload(
  items: Array<{ title: string; dueDate: string; tags: string[] }>,
) {
  const today = formatTodayIso();
  const todos: TaskCandidatePayload[] = [];
  const calendarEvents: TaskCandidatePayload[] = [];

  for (const item of items) {
    const payload = {
      title: item.title,
      due_date: item.dueDate,
      tags: item.tags,
    };
    if (item.dueDate === today) {
      todos.push(payload);
    } else {
      calendarEvents.push(payload);
    }
  }

  return { todos, calendar_events: calendarEvents };
}

export function extractErrorMessage(body: unknown, fallback: string) {
  if (typeof body === "string") {
    return body;
  }
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.error === "string") {
      return record.error;
    }
    if (record.error && typeof record.error === "object") {
      const errorBody = record.error as Record<string, unknown>;
      if (typeof errorBody.message === "string") {
        return errorBody.message;
      }
    }
  }
  return fallback;
}

export function unwrapApiResult<T>(body: T | ApiEnvelope<T>): T {
  if (
    body &&
    typeof body === "object" &&
    "status" in body &&
    "result" in body &&
    typeof (body as { status?: unknown }).status === "string"
  ) {
    const envelope = body as ApiEnvelope<T>;
    if (envelope.status !== "done") {
      throw new Error(extractErrorMessage(envelope.error, "서버 응답이 완료 상태가 아니에요."));
    }
    return envelope.result;
  }
  return body as T;
}

export async function postWebJson<T>(apiBase: string, path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractErrorMessage(body, "서버 요청에 실패했어요."));
  }

  return unwrapApiResult(body as T | ApiEnvelope<T>);
}

export function groupPlannerDays(result: TodoGenerateResult): PlannerDay[] {
  const days = new Map<string, PlannerDay["tasks"]>();
  for (const item of [...result.todos, ...result.calendar_events]) {
    const tasks = days.get(item.due_date) ?? [];
    tasks.push({ title: item.title, tags: item.tags ?? [] });
    days.set(item.due_date, tasks);
  }
  return Array.from(days.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, tasks]) => ({ date, tasks }));
}
