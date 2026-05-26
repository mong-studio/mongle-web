# 🌱 몽글마을 — Mongle Village

> 코지팜 마을을 거닐며 포모도로 집중 사이클을 돌리는 인터랙티브 웹앱.
> 빨간 지붕 통나무집, 떠도는 닭, 바람에 떨어지는 벚꽃잎 — 옆에 놓고
> 일하면 집중이 잘 됩니다.

![몽글마을 메인 화면](docs/screenshots/village_full.png)

---

## 🚀 5분 실행

### 필요한 것 (한 번만)
- **Node.js 18 이상** — https://nodejs.org/ 에서 LTS 받기
- **Git** — 대부분 기본 설치돼있음

### 실행

```bash
git clone https://github.com/simonuncle/game_test.git
cd game_test/web
npm install
npm run dev
```

→ 브라우저에서 **http://localhost:5173** 열기

끝.

---

## 🎮 조작

| 키 | 동작 |
|---|---|
| **WASD** / 방향키 | EJ 캐릭터 이동 |
| **Esc** | 25분 포모도로 타이머 시작 / 일시정지 |
| 우상단 **+** | 투두 입력 포커스 |
| **▶ START** | 집중 타이머 시작 |
| ↻ **RESET** | 타이머 초기화 |

자동으로 도는 것들:
- ⏱ 포모도로 25분 → 5분 휴식 (4번째 사이클은 15분 휴식)
- 🌅 120초 주기로 새벽 → 낮 → 노을 → 밤 색 보정
- 🐔 닭 5마리 마을 곳곳 산책
- 🌸 벚꽃잎 화면 따라 떨어짐
- 💾 투두/사이클 카운트 자동 저장 (브라우저 localStorage)

---

## ✨ 기능 한눈에

- **포모도로 타이머** — 클래식 25/5/15 사이클, 데스크탑 알림
- **투두 리스트** — 입력 → 체크 → 자동 영속화
- **알림 패널** — 사이클 완료 시 토스트
- **마을 탐험** — 18채 집, 광장, 시냇물, 다리
- **떠도는 닭 NPC** — 5마리 wander AI (집 안 들어감)
- **시간대 사이클** — `mix-blend-mode: multiply` CSS overlay
- **글래스모피즘 HUD** — `backdrop-blur` + 황금 보더
- **벚꽃잎 효과** — 순수 CSS 애니메이션

---

## 🌐 친구한테 URL로 보내고 싶다면 (Vercel 30초)

```bash
cd web
npm i -g vercel
vercel
```

질문 몇 개 답하면 URL 발급. 무료 플랜에서 충분.

또는 [Netlify Drop](https://app.netlify.com/drop)에 `npm run build` 결과물 `dist/` 폴더를 드래그.

---

## 🎨 그래픽 커스터마이즈

### 배경 이미지 교체 (가장 임팩트 큼)

`web/public/village_background.png` 를 원하는 이미지로 덮어쓰기:

```bash
cp ~/Downloads/your_painted_village.png web/public/village_background.png
```

권장:
- **크기**: 1280×768 이상 (1920×1280도 OK)
- **비율**: 4:3 또는 16:9
- **시점**: 위에서 본 2.5D 시점

AI 생성 프롬프트 예시 (Midjourney/DALL-E/Flux):
```
top-down 2.5D cozy village painting, red roof log cabins,
small bridge over creek, dense pine forest border,
sunny afternoon, Studio Ghibli + Stardew Valley vibe,
no UI overlays, no text, 1920x1280
```

### 캐릭터 이름 (촌장)
- 화면에 EJ 두 글자가 표시되는 부분.
- `web/src/store/useGameState.ts`의 `chiefName: "EJ"` 수정 후 저장.
- 또는 브라우저에서 `localStorage.clear()` 후 첫 실행.

### 색감 / 폰트
- `web/tailwind.config.js`의 `cozy` 색 팔레트 수정
- 폰트는 `web/index.html`의 Google Fonts 링크

---

## 📁 프로젝트 구조

```
.
├── README.md                  ← 지금 이 파일
├── CLAUDE.md                  ← Claude Code 세션 컨텍스트
├── web/                       ← 메인 — React + Vite 웹앱
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/        ← 마을 / 캐릭터 / HUD 패널들
│   │   └── store/             ← Zustand 상태 (자동저장)
│   ├── public/
│   │   └── village_background.png   ← 여기 갈아끼우면 모습 바뀜
│   └── README.md              ← 웹 빌드 세부 설명
├── docs/
│   ├── screenshots/           ← README 이미지
│   ├── CLAUDE_CODE_WORKFLOW.md  ← 작업 회고/패턴
│   ├── MCP_AND_SKILLS.md        ← MCP·스킬 가이드
│   ├── WEB_APP_ALTERNATIVE.md   ← 왜 웹앱인가
│   └── KNOWN_ISSUES.md          ← 미해결 + 알면 좋은 것들
├── legacy/godot/              ← 초기 Godot 버전 (참고용)
│   ├── project.godot
│   ├── scenes/
│   ├── scripts/
│   ├── assets/sparklin/       ← CC0 픽셀아트 (Pixel-boy)
│   ├── tools/build_village.py ← 배경 PNG 합성 스크립트
│   └── HOW_TO_RUN.md
└── .claude/skills/            ← Claude Code용 커스텀 스킬
    ├── tile-check.md          ← 타일 좌표 시각확인
    ├── village-rebuild.md     ← 빌드 풀 루프 자동화
    └── reference-classify.md  ← 레퍼런스 이미지 분류
```

---

## 🛠 기술 스택

- **React 18** + **TypeScript** + **Vite 5**
- **Tailwind CSS 3** — 글래스 패널 + 색 팔레트
- **Zustand 5** — 상태 + localStorage 영속화
- **Framer Motion** — UI 진입 애니메이션
- **lucide-react** — 아이콘
- **순수 SVG** — 캐릭터·닭 (스케일 자유로움)

배경 PNG는 [Sparklin Labs "Ninja Adventure"](https://github.com/sparklinlabs/superpowers-asset-packs) 타일셋(CC0)을
파이썬으로 합성한 것 (`legacy/godot/tools/build_village.py`). 원하면
규칙 바꿔서 마을 모양 재합성 가능.

---

## ⚠️ 알아두면 좋은 것

자세한 건 [`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md) 보기.

핵심 4개:
1. **다리 콜리전 없음** — 캐릭터가 강물 위로 그냥 걸어다닐 수 있음 (장식)
2. **모바일 미지원** — 1920×1080 데스크탑 최적. 모바일은 깨짐
3. **localStorage 저장** — 시크릿 모드/캐시 클리어시 사라짐
4. **사운드 없음** — BGM/SFX 미구현

---

## 📜 라이선스

- **코드**: MIT
- **픽셀아트** (`legacy/godot/assets/sparklin/`): CC0 by Pixel-boy ([원본](https://github.com/sparklinlabs/superpowers-asset-packs))
- **폰트**: Google Fonts (Press Start 2P, VT323, Noto Sans KR) — SIL Open Font License

---

## 🙋 막히면

- 실행 안 됨 → [`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md) 트러블슈팅 표
- 코드 구조 → [`web/README.md`](web/README.md)
- AI 협업 패턴 (이 프로젝트 만들면서 배운 것) → [`docs/CLAUDE_CODE_WORKFLOW.md`](docs/CLAUDE_CODE_WORKFLOW.md)
