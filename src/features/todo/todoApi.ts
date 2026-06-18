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

type TodoCommitResponse = {
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
  quest_distribution_triggered?: boolean;
};

type TodoConfirmPayload = {
  todos: {
    content: string;
    todo_date: string;
    tag_id?: number;
    tags?: string[];
    quest?: {
      character_id: string;
      content: string;
    } | null;
  }[];
};

type TodoQuestPreviewPayload = {
  todos: {
    content: string;
    tags?: string[];
  }[];
};

type TodoQuestPreviewResponse = {
  todos: {
    preview_id: string;
    content: string;
    tags: string[];
    quest?: {
      content: string;
      character_id: string;
      character_name: string;
      character_image_url?: string | null;
    } | null;
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

export function formatTodayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function generateTodos(prompt: string): Promise<TodoGenerateResult> {
  const { data } = await apiClient.post<TodoGenerateResult | ApiEnvelope<TodoGenerateResult>>(
    "/todos/generate/",
    { prompt },
  );
  return unwrapApiResult(data);
}

export async function confirmTodos(payload: TodoConfirmPayload): Promise<TodoCommitResponse> {
  const { data } = await apiClient.post<TodoCommitResponse>("/todos/confirm/", payload);
  return data;
}

export async function previewTodoQuests(
  payload: TodoQuestPreviewPayload,
): Promise<TodoQuestPreviewResponse> {
  const { data } = await apiClient.post<TodoQuestPreviewResponse>("/todos/quest-preview/", payload);
  return data;
}

export async function completeTodo(todoId: string): Promise<{ todo_id: string; status: string }> {
  const { data } = await apiClient.patch<{ todo_id: string; status: string }>(
    `/todos/${todoId}/complete/`,
  );
  return data;
}
