import { apiClient } from "../auth/client.js";
import type { FeedComment, FeedPostData } from "./feedData.js";

export interface ApiComment {
  comment_id: string;
  user: string;
  content: string;
  created_at: string;
}

export interface ApiPost {
  post_id: string;
  character: string;
  quest_id: string;
  img_url: string;
  content: string;
  is_liked: boolean;
  comments: ApiComment[];
  created_at: string;
}

export interface ApiCharacter {
  character_id: string;
  name: string;
  gen_img_url: string;
  active_quest_count: number;
}

export interface ApiCharacterDetail {
  character_id: string;
  name: string;
  gen_img_url: string;
  persona: string;
  is_active: boolean;
  created_at: string;
  active_quests: { quest_id: string; todo_id: string; title: string }[];
}

export async function fetchPosts(): Promise<ApiPost[]> {
  const { data } = await apiClient.get<ApiPost[]>("/posts/");
  return data;
}

export async function fetchPostDetail(postId: string): Promise<ApiPost> {
  const { data } = await apiClient.get<ApiPost>(`/posts/${postId}/`);
  return data;
}

export async function createComment(postId: string, content: string): Promise<ApiComment> {
  const { data } = await apiClient.post<ApiComment>(`/posts/${postId}/comments/`, { content });
  return data;
}

export async function fetchCharacters(): Promise<ApiCharacter[]> {
  const { data } = await apiClient.get<ApiCharacter[]>("/characters/");
  return data;
}

export async function fetchCharacterDetail(characterId: string): Promise<ApiCharacterDetail> {
  const { data } = await apiClient.get<ApiCharacterDetail>(`/characters/${characterId}/`);
  return data;
}

export function toFeedPost(post: ApiPost, charMap: Map<string, ApiCharacter>): FeedPostData {
  const char = charMap.get(post.character);
  const commentList: FeedComment[] = post.comments.map((c) => ({
    who: c.user,
    txt: c.content,
  }));
  return {
    id: post.post_id,
    name: char?.name ?? "캐릭터",
    role: "",
    time: formatRelativeTime(post.created_at),
    place: "",
    tint: "#F4DBC6",
    caption: [post.content],
    quest: { label: "퀘스트", value: post.quest_id },
    tags: [],
    likes: 0,
    comments: post.comments.length,
    heroPlaceholder: post.img_url || "이미지",
    commentList,
  };
}

function formatRelativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(isoStr).toLocaleDateString("ko-KR");
}
