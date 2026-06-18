import { useCallback, useMemo, useState } from "react";
import { apiClient } from "../api/client.js";
import type { CalTag, TagItem } from "./types.js";

// 유저 태그(/tags/) CRUD 훅. calendar·todo가 공유한다.
// createTag는 즉시 생성하고 새 id를 돌려준다(피커에서 생성 직후 선택용).
export function useTags(enabled: boolean) {
  const [tags, setTags] = useState<CalTag[]>([]);

  const tagItems = useMemo<TagItem[]>(
    () => tags.map((t) => ({ id: t.tag_id, content: t.content, color: t.color })),
    [tags],
  );

  const fetchTags = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await apiClient.get("/tags/");
      setTags(res.data as CalTag[]);
    } catch {
      /* 미인증/네트워크 오류 — 빈 상태 유지 */
    }
  }, [enabled]);

  const createTag = useCallback(async (name: string, color: string): Promise<number | null> => {
    try {
      const res = await apiClient.post("/tags/", { content: name, color });
      const created = res.data as CalTag;
      setTags((prev) => [...prev, created]);
      return created.tag_id;
    } catch {
      return null;
    }
  }, []);

  const deleteTag = useCallback(async (id: number) => {
    try {
      await apiClient.delete(`/tags/${id}/`);
      setTags((prev) => prev.filter((t) => t.tag_id !== id));
    } catch {
      /* ignore */
    }
  }, []);

  const editTag = useCallback(async (id: number, content: string, color: string) => {
    try {
      const res = await apiClient.patch(`/tags/${id}/`, { content, color });
      setTags((prev) => prev.map((t) => (t.tag_id === id ? (res.data as CalTag) : t)));
    } catch {
      /* ignore */
    }
  }, []);

  return { tagItems, fetchTags, createTag, deleteTag, editTag };
}
