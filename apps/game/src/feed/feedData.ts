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

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  emoji: string;
  location: string;
  bio: string;
  stats: { posts: number; hearts: number; followers: number };
}

export interface MongsilPost {
  id: string;
  food: string;
  title: string;
  time: string;
  location: string;
  body: string;
  quest: string;
  tags: string[];
  hearts: number;
  commentList: { who: string; text: string }[];
}

export const MONGSIL: CharacterProfile = {
  id: "mongsil",
  name: "몽실이",
  role: "요리 연구가",
  emoji: "🐑",
  location: "몽글마을 집 앞 텃밭",
  bio: "매일 새로운 레시피를 연구하는 몽글마을 요리사 🥕\n따뜻한 한 그릇을 함께 나눠요.",
  stats: { posts: 18, hearts: 246, followers: 9 },
};

export const MONGSIL_POSTS: MongsilPost[] = [
  {
    id: "mp1",
    food: "🥕",
    title: "갓 수확한 당근 수프",
    time: "1분 전",
    location: "몽글마을 집 앞 텃밭",
    body: "새로운 레시피 연구는 언제나 두근두근해!\n오늘은 텃밭에서 갓 수확한 당근으로 당근 수프를 만들어봤어 🥕\n따뜻한 향이 마을 전체에 퍼지는 것 같아서 기분이 좋아졌어!\n다음엔 어떤 재료를 써볼까? 히히 🙂",
    quest: "새로운 요리 레시피 연구 중이야! 🥕",
    tags: ["요리연구", "당근수프", "오늘의실험", "몽실이의하루"],
    hearts: 24,
    commentList: [
      { who: "두부", text: "향이 여기까지 나는 것 같아요…☺️" },
      { who: "콩이", text: "나도 한 그릇 줘!! 🏃" },
    ],
  },
  {
    id: "mp2",
    food: "🍓",
    title: "딸기잼 한 병",
    time: "3시간 전",
    location: "몽글마을 부엌",
    body: "아침 일찍 딸기를 졸여서 잼을 만들었어 🍓\n뭉근하게 끓이는 동안 부엌이 온통 달콤한 냄새로 가득!\n내일 아침엔 갓 구운 빵에 발라 먹을 거야.",
    quest: "겨울나기 저장식 만들기 🍓",
    tags: ["딸기잼", "저장식", "달콤주의"],
    hearts: 31,
    commentList: [{ who: "밤비", text: "한 병만 나눠주면 안 될까…🥺" }],
  },
  {
    id: "mp3",
    food: "🍞",
    title: "허브 통밀빵",
    time: "어제",
    location: "몽글마을 부엌",
    body: "반죽을 천천히 발효시키는 시간이 제일 좋아.\n텃밭 허브를 듬뿍 넣어서 향긋한 통밀빵을 구웠어 🌿\n겉은 바삭, 속은 폭신하게 잘 나왔어!",
    quest: "천연발효빵 굽기 🍞",
    tags: ["베이킹", "통밀빵", "허브"],
    hearts: 19,
    commentList: [],
  },
  {
    id: "mp4",
    food: "🎃",
    title: "단호박 그라탕",
    time: "2일 전",
    location: "몽글마을 부엌",
    body: "통통하게 익은 단호박을 통째로 구워서 그라탕을 만들었어 🎃\n치즈가 보글보글 녹는 순간을 제일 좋아해!\n쌀쌀해진 저녁에 딱 어울리는 한 그릇.",
    quest: "가을 제철요리 연구 🎃",
    tags: ["단호박", "그라탕", "가을요리"],
    hearts: 27,
    commentList: [{ who: "두부", text: "기록해두고 싶은 레시피네요 ✍️" }],
  },
  {
    id: "mp5",
    food: "🍲",
    title: "버섯 리조또",
    time: "3일 전",
    location: "몽글마을 숲길",
    body: "숲길에서 캐온 버섯으로 리조또를 끓였어 🍄\n쌀알 하나하나에 향이 스며들 때까지 천천히 저어주는 게 비결!",
    quest: "숲 재료 활용하기 🍄",
    tags: ["리조또", "버섯", "숲의선물"],
    hearts: 22,
    commentList: [],
  },
  {
    id: "mp6",
    food: "🍎",
    title: "사과 타르트",
    time: "4일 전",
    location: "몽글마을 부엌",
    body: "마을에서 받은 사과로 타르트를 구웠어 🍎\n얇게 썬 사과를 한 장 한 장 올리는 시간이 명상 같아.\n달콤한 보상으로 사과 12개를 받았지 뭐야!",
    quest: "사과 보상 디저트 만들기 🍎",
    tags: ["사과타르트", "디저트", "오늘의보상"],
    hearts: 35,
    commentList: [
      { who: "콩이", text: "비주얼 미쳤다 🤩" },
      { who: "밤비", text: "한 조각의 행복…" },
    ],
  },
  {
    id: "mp7",
    food: "🌽",
    title: "옥수수 수프",
    time: "5일 전",
    location: "몽글마을 집 앞 텃밭",
    body: "노랗게 잘 익은 옥수수를 갈아서 고소한 수프를 만들었어 🌽\n한 입 먹으면 마음까지 따뜻해지는 맛!",
    quest: "텃밭 수확물 요리하기 🌽",
    tags: ["옥수수수프", "고소함", "텃밭일기"],
    hearts: 18,
    commentList: [],
  },
  {
    id: "mp8",
    food: "🍵",
    title: "캐모마일 허브티",
    time: "6일 전",
    location: "몽글마을 집 앞 텃밭",
    body: "오늘은 불 앞에 오래 서 있어서 잠깐 쉬어가는 시간 🍵\n직접 말린 캐모마일로 차를 우렸어. 향이 정말 포근해.",
    quest: "허브 말리기 🌼",
    tags: ["허브티", "쉬어가기", "포근"],
    hearts: 26,
    commentList: [{ who: "두부", text: "차분해지는 사진이네요 ☕" }],
  },
  {
    id: "mp9",
    food: "🍅",
    title: "토마토 파스타",
    time: "1주 전",
    location: "몽글마을 부엌",
    body: "잘 익은 토마토를 푹 끓여 소스를 만들었어 🍅\n새콤달콤한 향이 부엌을 가득 채웠지!\n다 같이 모여서 한 그릇씩 나눠 먹었어.",
    quest: "마을 나눔 요리 🍝",
    tags: ["파스타", "토마토", "함께먹기"],
    hearts: 29,
    commentList: [],
  },
];

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
