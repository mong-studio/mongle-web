# 세팅 가이드 (프론트엔드)

이 문서는 `mongle-web` 프론트엔드를 처음 받는 팀원이 설치, 실행, 빌드까지 따라 할 수 있도록 돕습니다.

- 프로젝트 구조와 개발 원칙: [project-guide.md](project-guide.md)
- Git과 PR 방법: [git-strategy.md](git-strategy.md)
- 코드 품질·린트·커밋 검사: [../../../docs/code-quality-guide.md](../../../docs/code-quality-guide.md)

## 이 프로젝트는 무엇인가요?

이 저장소는 React + Vite 앱입니다. 마을 배경은 Phaser가 Tiled 맵을 렌더링하고, React는 HUD와 기능 UI를 담당합니다.

## 미리 준비할 것

| 도구 | 권장 버전 | 확인 명령어 | 용도 |
| --- | --- | --- | --- |
| Node.js | 20 이상 | `node -v` | React/Vite 앱 실행·빌드 |
| npm | 10 이상 | `npm -v` | 패키지 설치, 명령어 실행 |

## 처음 한 번만: 설치

작업 공간 루트에서 실행합니다.

```bash
npm install
npm install
```

## 화면 실행

```bash
npm run dev
```

브라우저에서 아래 주소를 엽니다.

```text
http://127.0.0.1:5173/
```

마을 배경과 HUD가 보이면 성공입니다.

## AI 기능 사용

할 일 입력창과 플래너 챗봇은 API를 호출합니다.

- 화면은 `VITE_API_BASE` 기준 `/api/v1/*` 주소로 요청을 보냅니다.
- API가 꺼져 있어도 일부 기능은 로컬 fallback으로 동작합니다.

## 환경 변수

```bash
cp .env.example .env.local
```

| 변수 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `VITE_API_BASE` | 아니오 | same-origin | API 기본 주소 |

## 맵 에셋

Phaser는 아래 파일들을 사용합니다.

```text
public/assets/map/mongle.tmj
public/assets/map/*.tsx
public/assets/map/*.png
```

맵이 비어 보이거나 일부 타일이 빠지면 `mongle.tmj`가 참조하는 `.tsx` 파일과 `.tsx` 내부 이미지 파일이 실제로 있는지 확인합니다.

## 빌드

```bash
npm run build
```

빌드 결과는 `dist/`에 생깁니다.

## 명령어 치트시트

| 명령어 | 무엇을 하나요? |
| --- | --- |
| `npm install` | 화면 앱 의존성 설치 |
| `npm run dev` | 개발 서버 실행 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run build` | 타입 검사 + 배포용 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run check:fix` | 코드 검사 + 자동 수정 |
| `npm run ci-check` | CI와 같은 검증 |

## 잘 안 될 때

- `npm run dev`가 안 켜지면 `npm install`과 `npm install`을 다시 실행합니다.
- 마을 배경이 비어 있으면 `public/assets/map/`의 맵/타일셋/이미지 파일을 확인합니다.
- API 기능이 동작하지 않으면 API 서버 주소와 `VITE_API_BASE`를 확인합니다.
