// 유저 태그. calendar·todo가 공유한다. 백엔드 /tags/ 가 원본.
export type CalTag = { tag_id: number; content: string; color: string };

// UI에서 다루는 정규화된 태그.
export type TagItem = { id: number; content: string; color: string };
