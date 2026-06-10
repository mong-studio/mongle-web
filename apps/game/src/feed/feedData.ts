export interface ThemeTokens {
  ink: string;
  inkSoft: string;
  modalBg: string;
  modalEdge: string;
  headerBg: string;
  cardBg: string;
  cardEdge: string;
  rowBg: string;
  rowEdge: string;
  badgeBg: string;
  badgeInk: string;
  tagBg: string;
  tagInk: string;
  accent: string;
  accentInk: string;
  like: string;
  sceneTop: string;
  sceneBottom: string;
  sceneHill: string;
  sceneCloud: string;
  sceneSun: string;
  deskBg: string;
}

export const THEMES: Record<string, ThemeTokens> = {
  "크림 당근": {
    ink: "#5A4636",
    inkSoft: "#A89A86",
    modalBg: "#FAEFD9",
    modalEdge: "#ECD4B4",
    headerBg: "#FCEFD6",
    cardBg: "#FFFDF8",
    cardEdge: "#F0E2CC",
    rowBg: "#FBF5EA",
    rowEdge: "#EFE3D0",
    badgeBg: "#F7CDA6",
    badgeInk: "#B26A3E",
    tagBg: "#EAE6F7",
    tagInk: "#7E76B8",
    accent: "#E0894C",
    accentInk: "#FFFFFF",
    like: "#F2627A",
    sceneTop: "#BFE3F2",
    sceneBottom: "#DCEFCB",
    sceneHill: "#B7DD9C",
    sceneCloud: "#FFFFFF",
    sceneSun: "#FFE39A",
    deskBg: "#E9D7BB",
  },
  "민트 들판": {
    ink: "#33514A",
    inkSoft: "#85A79B",
    modalBg: "#EAF6EC",
    modalEdge: "#C7E3CC",
    headerBg: "#E5F4E8",
    cardBg: "#FBFFFB",
    cardEdge: "#DBEEDD",
    rowBg: "#F0F8F0",
    rowEdge: "#D8ECDA",
    badgeBg: "#BFE6C9",
    badgeInk: "#3E7A55",
    tagBg: "#DCEEF0",
    tagInk: "#4E8E91",
    accent: "#56AC7A",
    accentInk: "#FFFFFF",
    like: "#EC6F8E",
    sceneTop: "#CFEFF0",
    sceneBottom: "#D7F0CF",
    sceneHill: "#AEDFA7",
    sceneCloud: "#FFFFFF",
    sceneSun: "#FFF0B8",
    deskBg: "#CFE6D2",
  },
  "라벤더 노을": {
    ink: "#4F4260",
    inkSoft: "#9D93B0",
    modalBg: "#F6EFF8",
    modalEdge: "#E1D0E9",
    headerBg: "#F3E9F6",
    cardBg: "#FFFBFF",
    cardEdge: "#ECDDF0",
    rowBg: "#F6EFF8",
    rowEdge: "#E7D8EC",
    badgeBg: "#E7CFEC",
    badgeInk: "#8A5AA0",
    tagBg: "#F8DCE6",
    tagInk: "#B5658A",
    accent: "#B66BA6",
    accentInk: "#FFFFFF",
    like: "#E8617E",
    sceneTop: "#FAD9C8",
    sceneBottom: "#E6D2F0",
    sceneHill: "#D3BCE6",
    sceneCloud: "#FFF3F0",
    sceneSun: "#FFC98A",
    deskBg: "#DDCBE8",
  },
};

export const THEME_ORDER = ["크림 당근", "민트 들판", "라벤더 노을"] as const;
export type ThemeName = (typeof THEME_ORDER)[number];

export interface FeedComment {
  who: string;
  txt: string;
}

export interface FeedPostData {
  id: string;
  name: string;
  role: string;
  time: string;
  place: string;
  tint: string;
  caption: string[];
  quest: { label: string; value: string };
  tags: string[];
  likes: number;
  comments: number;
  heroPlaceholder: string;
  commentList: FeedComment[];
}

export const POSTS: FeedPostData[] = [
  {
    id: "mongsil",
    name: "몽실이",
    role: "요리 연구가",
    time: "1분 전",
    place: "몽글마을 집 앞 텃밭",
    tint: "#F4DBC6",
    caption: [
      "새로운 레시피 연구는 언제나 두근두근해!",
      "오늘은 텃밭에서 갓 수확한 당근으로 당근 수프를 만들어봤어 🥕",
      "따뜻한 향이 마을 전체에 퍼지는 것 같아서 기분이 좋아졌어!",
      "다음엔 어떤 재료를 써볼까? 히히 🙂",
    ],
    quest: { label: "몽실이의 퀘스트", value: "새로운 요리 레시피 연구 중이야! 🥕" },
    tags: ["요리연구", "당근수프", "오늘의실험", "몽실이의하루"],
    likes: 24,
    comments: 7,
    heroPlaceholder: "몽실이의 요리 사진을 드롭하세요 🥕",
    commentList: [
      { who: "토토", txt: "냄새가 강가까지 솔솔~ 한 그릇 부탁해! 🐟" },
      { who: "별이", txt: "당근 수프 너무 좋아요! 꽃이랑 같이 먹을래요 🌷" },
    ],
  },
  {
    id: "kong",
    name: "콩이",
    role: "텃밭 농부",
    time: "12분 전",
    place: "몽글마을 동쪽 밭",
    tint: "#E7E0C4",
    caption: [
      "호박이 이~만큼 자랐어! 🎃",
      "매일 물 주고 노래도 불러줬더니",
      "마을에서 제일 큰 호박이 됐지 뭐야!",
      "가을 축제에 내놓을 거야~ 두근두근",
    ],
    quest: { label: "콩이의 퀘스트", value: "가을 축제용 왕호박 키우기 🎃" },
    tags: ["텃밭일기", "왕호박", "가을축제", "콩이네밭"],
    likes: 41,
    comments: 12,
    heroPlaceholder: "콩이의 왕호박 사진을 드롭하세요 🎃",
    commentList: [
      { who: "몽실이", txt: "그 호박으로 수프 끓이면 마을 전체가 먹겠다! 😄" },
      { who: "토토", txt: "축제 때 내가 사진 찍어줄게! 📸" },
    ],
  },
  {
    id: "toto",
    name: "토토",
    role: "강가 낚시꾼",
    time: "1시간 전",
    place: "몽글마을 반짝 강가",
    tint: "#CFE3E6",
    caption: [
      "오늘은 무지개 물고기를 낚았어! 🐟✨",
      "햇빛에 비치니까 일곱 빛깔로 반짝여...",
      "너무 예뻐서 다시 강에 놓아줬어.",
      "다음엔 꼭 사진 더 많이 찍을게!",
    ],
    quest: { label: "토토의 퀘스트", value: "전설의 무지개 물고기 찾기 🎣" },
    tags: ["낚시일지", "무지개물고기", "반짝강가", "토토의모험"],
    likes: 58,
    comments: 19,
    heroPlaceholder: "토토의 낚시 사진을 드롭하세요 🎣",
    commentList: [
      { who: "별이", txt: "놓아준 거 잘했어요! 마음이 예쁘다 🐟" },
      { who: "콩이", txt: "다음엔 같이 가자! 미끼는 내가 준비할게 🪱" },
    ],
  },
  {
    id: "byeol",
    name: "별이",
    role: "꽃집 주인",
    time: "오늘 아침",
    place: "몽글마을 꽃길",
    tint: "#F0D4DE",
    caption: [
      "봄꽃이 한가득 피었어요 🌷",
      "마을 입구가 온통 분홍빛으로 물들었답니다.",
      "지나가는 친구들 모두 한 송이씩 가져가세요!",
      "향기로 가득한 하루 되길 🌸",
    ],
    quest: { label: "별이의 퀘스트", value: "마을 꽃길 가꾸기 🌷" },
    tags: ["꽃집일기", "봄꽃축제", "꽃길산책", "별이의정원"],
    likes: 33,
    comments: 9,
    heroPlaceholder: "별이의 꽃길 사진을 드롭하세요 🌷",
    commentList: [
      { who: "몽실이", txt: "꽃 한 송이로 식탁 꾸며야지! 고마워요 🌼" },
      { who: "토토", txt: "강가에도 좀 심어줘요~ 🌸" },
    ],
  },
  {
    id: "maru",
    name: "마루",
    role: "마을 우체부",
    time: "3시간 전",
    place: "몽글마을 한 바퀴",
    tint: "#DCE0EC",
    caption: [
      "오늘도 마을 곳곳에 편지를 배달했어요 ✉️",
      "멀리 사는 친구의 안부 편지가 제일 많았어!",
      "모두의 소식을 전할 수 있어서 행복해.",
      "답장도 잊지 말기예요 💌",
    ],
    quest: { label: "마루의 퀘스트", value: "마을 편지 모두 배달하기 ✉️" },
    tags: ["우체부일기", "편지배달", "마을한바퀴", "마루의하루"],
    likes: 27,
    comments: 6,
    heroPlaceholder: "마루의 배달 사진을 드롭하세요 ✉️",
    commentList: [
      { who: "별이", txt: "꽃 편지 보낼 거예요! 잘 부탁해요 💐" },
      { who: "콩이", txt: "내 호박 자랑 편지도 부탁해~ 🎃" },
    ],
  },
];
