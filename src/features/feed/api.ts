import { apiClient } from "../../shared/api/client.js";
import type { FeedComment, FeedPostData } from "./feedData.js";

export interface ApiReply {
  reply_id: string;
  character: string;
  character_name: string;
  gen_img_url?: string | null;
  content: string;
  created_at: string;
}

export interface ApiComment {
  comment_id: string;
  user: string;
  user_name: string;
  content: string;
  created_at: string;
  replies: ApiReply[];
}

export interface ApiPost {
  post_id: string;
  character: string;
  character_name: string;
  quest_id: string;
  gen_img_url?: string | null;
  character_gen_img_url?: string | null;
  img_url: string;
  content: string;
  is_liked: boolean;
  comments: ApiComment[];
  daily_comment_count?: number | null;
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
  // persona 의 [성격] 구획만 서버가 추출해 내려준 값(소개란용).
  personality: string;
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

export async function toggleLike(postId: string): Promise<boolean> {
  const { data } = await apiClient.post<{ is_liked: boolean }>(`/posts/${postId}/like/`);
  return data.is_liked;
}

interface CharacterListResponse {
  items: ApiCharacter[];
  page: { limit: number; next_cursor: string | null; has_next: boolean };
}

export async function fetchCharacters(): Promise<ApiCharacter[]> {
  // /characters/ 는 커서 페이지네이션 응답({items, page})을 반환한다.
  const { data } = await apiClient.get<CharacterListResponse>("/characters/");
  return data.items ?? [];
}

export async function fetchCharacterDetail(characterId: string): Promise<ApiCharacterDetail> {
  const { data } = await apiClient.get<ApiCharacterDetail>(`/characters/${characterId}/`);
  return data;
}

export function toFeedPost(post: ApiPost, charMap: Map<string, ApiCharacter>): FeedPostData {
  const char = charMap.get(post.character);
  const commentList: FeedComment[] = post.comments.map((c) => ({
    who: c.user_name,
    txt: c.content,
  }));
  return {
    id: post.post_id,
    name: char?.name ?? post.character_name ?? "캐릭터",
    role: "",
    time: "",
    createdAt: post.created_at,
    place: "",
    tint: "#F4DBC6",
    caption: [post.content],
    quest: { label: "퀘스트", value: post.quest_id },
    tags: [],
    likes: post.is_liked ? 1 : 0,
    isLiked: post.is_liked,
    comments: post.comments.length,
    heroPlaceholder: "사진",
    imageUrl: post.img_url,
    avatarUrl: char?.gen_img_url ?? post.gen_img_url ?? post.character_gen_img_url ?? undefined,
    commentList,
  };
}
