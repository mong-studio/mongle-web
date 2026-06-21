import { apiClient } from "../../shared/api/client.js";

export type ReflectionRecord = {
  reflection_id: string;
  reflection_date: string;
  good_points: string;
  improvement_points: string;
  good_token_rewarded?: boolean;
  improvement_token_rewarded?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ReflectionTodoRecord = {
  todo_id: string;
  content: string;
  status: string;
  todo_date: string;
  tag_id?: string | null;
  tag_content?: string | null;
  tag_color?: string | null;
};

export type ReflectionContextResponse = {
  reflection_date: string;
  completed_todos: ReflectionTodoRecord[];
  incomplete_todos: ReflectionTodoRecord[];
  already_reflected: boolean;
  reflection?: ReflectionRecord;
};

export type ReflectionCreateResponse = {
  reflection_id: string;
  reflection_date: string;
  good_points: string;
  improvement_points: string;
  token: number;
};

export type ReflectionUpdateResponse = {
  reflection_id: string;
  reflection_date: string;
  good_points: string;
  improvement_points: string;
  reward: number;
  update_cost?: number;
  new_reward?: number;
  token_delta?: number;
  updated_at: string;
};

export async function fetchReflectionContext(date: string) {
  const { data } = await apiClient.get<ReflectionContextResponse>(`/reflections/context/${date}/`);
  return data;
}

export async function fetchPastReflections(before: string) {
  const { data } = await apiClient.get<ReflectionRecord[]>("/reflections/", {
    params: { before },
  });
  return data;
}

export async function createReflection(payload: {
  reflection_date: string;
  good_points: string;
  improvement_points: string;
}) {
  const { data } = await apiClient.post<ReflectionCreateResponse>("/reflections/", payload);
  return data;
}

export async function updateReflection(
  reflectionId: string,
  payload: {
    good_points: string;
    improvement_points: string;
  },
) {
  const { data } = await apiClient.patch<ReflectionUpdateResponse>(
    `/reflections/${reflectionId}/`,
    payload,
  );
  return data;
}
