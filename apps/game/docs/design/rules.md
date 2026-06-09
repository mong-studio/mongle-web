---
name: rules
description: 몽글마을 UI 규칙 — 타이포그래피, z-index, 반응형, 픽셀 렌더링, 금지사항, 완료 체크리스트.
---

# 몽글마을 UI 규칙

## 타이포그래피

폰트는 전역 설정됨 — `font-family` 재지정 불필요.
`DotGothic16 → Apple SD Gothic Neo → Malgun Gothic → monospace`

| 용도 | 크기 | weight |
|------|------|--------|
| 모달 h2 | `clamp(1.45rem, 3vw, 2.25rem)` | — |
| townNav h1 | `clamp(1.2rem, 2.2vw, 2rem)` | — |
| 패널 헤더 | `1rem` | `950` |
| 대화 본문 | `1.02rem` | `900` |
| 퀘스트 설명 | `0.82rem` | `900` |
| 서브텍스트 | `0.78rem` | `900` |
| 힌트 / 메타 | `0.68–0.72rem` | `900` |

최소 `font-weight: 900` — 얇은 글자 금지.

## Z-index 레이어

```
0  — godotLayer (Godot iframe)
1  — shadeLayer
6  — leftRail, questPanel
7  — dialogueBox, talkButton
8  — townNav
30 — modalBackdrop
```

새 UI는 이 사이 정수 값으로 배치.

## 반응형 브레이크포인트

```css
@media (max-width: 1060px) { /* 패널 폭 축소 */ }
@media (max-width: 760px)  { /* position: absolute → static + margin: 10px */ }
```

## 픽셀 렌더링

```css
image-rendering: pixelated; /* 모든 스프라이트/픽셀 이미지 */
```

사용자 업로드 미리보기만 `image-rendering: auto` 허용.

## 금지 사항

| 금지 | 대신 |
|------|------|
| `border-radius` | 직각 유지 |
| `#000` / `#fff` 순색 | `#4b2f1f` / `#fff5d1` |
| `box-shadow` 없는 패널 | inset + drop 반드시 포함 |
| 네온 컬러, 그라디언트 버튼 | colors.md 팔레트만 |
| `font-weight` < 900 | 최소 900 |
| 임의 새 색상 | colors.md에서 선택 |
| `image-rendering: crisp-edges` | `pixelated` 사용 |
| 검정 외곽선 | 다크 브라운 계열 |

## 완료 체크리스트

- [ ] 새 패널에 `border: 4px solid #4b2f1f` + inset box-shadow
- [ ] 버튼에 3D 돌출 box-shadow
- [ ] 픽셀 이미지에 `image-rendering: pixelated`
- [ ] 색상이 colors.md 표 안에 있음
- [ ] `border-radius` 없음
- [ ] `font-weight` 최소 900
- [ ] z-index가 레이어 계층에 맞음
- [ ] 모바일 브레이크포인트 대응 (1060px, 760px)
