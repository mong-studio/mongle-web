import { useCallback, useMemo, useState } from "react";
import { apiClient } from "../../shared/api/client.js";
import type { CalTag, TagItem } from "./types.js";

export function useTagManager(isAuthenticated: boolean) {
  const [tags, setTags] = useState<CalTag[]>([]);

  const tagItems = useMemo<TagItem[]>(
    () => tags.map((t) => ({ id: t.tag_id, content: t.content, color: t.color })),
    [tags],
  );

  const fetchTags = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.get("/todos/tags/");
      setTags(res.data as CalTag[]);
    } catch {
      /* ignore */
    }
  }, [isAuthenticated]);

  const createTag = useCallback(async (name: string, color: string): Promise<number | null> => {
    try {
      const res = await apiClient.post("/todos/tags/", { content: name, color });
      const created = res.data as CalTag;
      setTags((prev) => [...prev, created]);
      return created.tag_id;
    } catch {
      return null;
    }
  }, []);

  const deleteTag = useCallback(async (id: number) => {
    try {
      await apiClient.delete(`/todos/tags/${id}/`);
      setTags((prev) => prev.filter((t) => t.tag_id !== id));
    } catch {
      /* ignore */
    }
  }, []);

  const editTag = useCallback(async (id: number, content: string, color: string) => {
    try {
      const res = await apiClient.patch(`/todos/tags/${id}/`, { content, color });
      setTags((prev) => prev.map((t) => (t.tag_id === id ? (res.data as CalTag) : t)));
    } catch {
      /* ignore */
    }
  }, []);

  return { tags, tagItems, fetchTags, createTag, deleteTag, editTag };
}
