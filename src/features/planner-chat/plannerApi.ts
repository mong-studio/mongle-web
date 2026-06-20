import { apiClient } from "../../shared/api/client.js";

type ApiEnvelope<T> = {
  status: string;
  result: T;
  error: unknown;
};

type TaskCandidatePayload = {
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

export type TodoChatOutOfScopeResult = {
  kind: "out_of_scope";
  thread_id: string;
  message: string;
};

export type PlannerTask = {
  title: string;
  due_date: string;
  tags?: string[];
};

export type PlannerDay = {
  date: string;
  tasks: {
    title: string;
    detail?: string;
    tags?: string[];
  }[];
};

type PlannerSavePayload = {
  todos: PlannerTask[];
  calendar_events: PlannerTask[];
};

type PlannerSaveResponse = {
  todos: {
    todo_id: string;
    content: string;
    todo_date: string;
    tags: string[];
    quest?: {
      quest_id: string;
      content: string;
      character_id: string;
      character_name: string;
    } | null;
  }[];
  calendar_events: {
    schedule_id: string;
    title: string;
    start_date: string;
    end_date: string | null;
    tags: string[];
  }[];
  quest_distribution_triggered?: boolean;
};

function extractErrorMessage(body: unknown, fallback: string) {
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

function unwrapApiResult<T>(body: T | ApiEnvelope<T>): T {
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

export async function chatTodos(payload: {
  message: string;
  thread_id?: string | null;
}): Promise<TodoChatFollowUpResult | TodoChatOutOfScopeResult | TodoGenerateResult> {
  const { data } = await apiClient.post<
    | TodoChatFollowUpResult
    | TodoChatOutOfScopeResult
    | TodoGenerateResult
    | ApiEnvelope<TodoChatFollowUpResult | TodoChatOutOfScopeResult | TodoGenerateResult>
  >("/todos/chat/", payload);
  return unwrapApiResult(data);
}

export async function savePlannerTodos(payload: PlannerSavePayload): Promise<PlannerSaveResponse> {
  const { data } = await apiClient.post<PlannerSaveResponse>("/todos/planner-confirm/", payload);
  return data;
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
