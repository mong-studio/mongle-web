export type FeatureId = "character" | "todo" | "planner";

export type Feature = {
  id: FeatureId;
  title: string;
  npcLine: string;
  meta: string;
};

export const FEATURES: Record<FeatureId, Feature> = {
  character: {
    id: "character",
    title: "새 주민 들이기",
    npcLine: "마을에 어울릴 새 친구를 같이 만들어볼까?",
    meta: "캐릭터 최대 10명 · 이미지 재생성 일 3회",
  },
  todo: {
    id: "todo",
    title: "오늘의 TODO 만들기",
    npcLine: "할 일을 적어주면 마을 친구들에게 퀘스트로 나눠줄게.",
    meta: "싱글턴 200자 · 멀티턴 600자 · 퀘스트 분배 일 5회",
  },
  planner: {
    id: "planner",
    title: "플래너 챗봇이랑 계획 짜기",
    npcLine: "목표가 흐릿하면 내가 질문하면서 일정으로 정리해줄게.",
    meta: "한국어 플랜 · 태그 추천 · 확인 후 저장",
  },
};
