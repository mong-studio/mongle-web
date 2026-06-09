---
name: components
description: 몽글마을 CSS 컴포넌트 패턴. 새 UI 요소 작성 시 로드. 색상 hex는 Skill("colors") 참조.
---

# 몽글마을 컴포넌트 패턴

색상 hex가 필요하면 `Skill("colors")`를 추가로 로드하세요.

## 패널

```css
.panel {
  border: 4px solid #4b2f1f;
  box-shadow:
    inset 0 0 0 3px rgba(255, 246, 202, 0.45),
    0 6px 0 rgba(44, 28, 20, 0.55),
    0 18px 34px rgba(23, 22, 16, 0.28);
  background: #f7df9e;
  image-rendering: pixelated;
}
```

## 버튼

```css
.button {
  min-height: 34px;
  border: 3px solid #453023;
  box-shadow:
    inset 0 0 0 2px rgba(255, 244, 196, 0.55),
    0 3px 0 rgba(50, 33, 22, 0.55);
  background: #8a5b38;
  color: #fff5d1;
  font-weight: 900;
  cursor: pointer;
}
```

## 아이템 행 (퀘스트/투두)

```css
.item {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 9px;
  align-items: center;
  min-height: 48px;
  padding: 8px;
  border: 3px solid #8e6038;
  background: #fff4c5;
}
.item.isDone { opacity: 0.72; }
.item.isDone p, .item.isDone b { text-decoration: line-through; }
```

## 패널 헤더

```css
.panelHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 3px solid #8f5c34;
}
.panelHeader span { color: #3d2a1d; font-size: 1rem; font-weight: 950; }
.panelHeader b    { color: #7c4d2c; font-size: 0.72rem; }
```

## 말풍선 (noticeBubble)

```css
.bubble {
  display: grid;
  gap: 5px;
  padding: 10px;
  border: 4px solid #4b2f1f;
  box-shadow:
    inset 0 0 0 3px rgba(255, 246, 202, 0.45),
    0 6px 0 rgba(44, 28, 20, 0.55);
  background: #fff1bd;
  color: #4b3021;
  image-rendering: pixelated;
}
.bubble b    { color: #7b3d29; }
.bubble span { font-size: 0.78rem; line-height: 1.35; }
```

## 모달

```css
.modalBackdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 26px;
  background: rgba(21, 18, 16, 0.58);
}
.modal {
  position: relative;
  width: min(700px, 100%);
  max-height: min(760px, calc(100vh - 52px));
  overflow: auto;
  padding: 24px;
  border: 4px solid #4b2f1f;
  box-shadow:
    inset 0 0 0 3px rgba(255, 246, 202, 0.45),
    0 6px 0 rgba(44, 28, 20, 0.55),
    0 18px 34px rgba(23, 22, 16, 0.28);
  background: #f8dea1;
  image-rendering: pixelated;
}
```

## 인라인 태그

```css
.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 3px 8px;
  border: 2px solid #8e6038;
  background: #fff4c5;
  color: #5b3925;
  font-size: 0.7rem;
  font-weight: 950;
}
.tag img {
  width: 18px;
  height: 18px;
  border: 1px solid #7b4d2b;
  image-rendering: pixelated;
}
```

## 대화창 (dialogueBox)

```css
.dialogueBox {
  position: absolute;
  z-index: 7;
  left: 50%;
  bottom: 22px;
  width: min(920px, calc(100vw - 280px));
  min-height: 180px;
  display: grid;
  grid-template-columns: 112px minmax(160px, 1fr) minmax(320px, 1.2fr);
  gap: 14px;
  padding: 14px;
  transform: translateX(-50%);
  border: 4px solid #4b2f1f;
  box-shadow:
    inset 0 0 0 3px rgba(255, 246, 202, 0.45),
    0 6px 0 rgba(44, 28, 20, 0.55),
    0 18px 34px rgba(23, 22, 16, 0.28);
  background: #f8dea1;
  image-rendering: pixelated;
}
```
