// 직업 선택 목록의 단일 소스. 회원가입·카카오 온보딩·마이페이지가 공유한다.
// User.job 은 free text(max_length 20)라 DB enum 이 없으므로, 화면 간 목록 불일치를
// 막기 위해 여기서만 정의한다. 모든 값은 20자 이내여야 한다(백엔드 max_length).
export const JOB_OPTIONS = [
  "학생",
  "직장인",
  "프리랜서",
  "자영업",
  "주부",
  "기획자",
  "개발자",
  "디자이너",
  "기타",
] as const;
