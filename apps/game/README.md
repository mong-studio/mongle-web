# Mongle Village Web MVP

A React/Vite web shell that embeds a Godot Web export in an iframe. The Godot scene is a cozy top-down farming RPG style village with a focus timer, todo panel, clickable NPCs/buildings, and dialogue text.

This is an original prototype. The reference screenshot is stored under `legacy/reference/` for visual direction only; the code does not extract or copy assets from it.

## 문서 안내 (처음이라면 여기부터)

개발이 처음인 팀원은 아래 순서로 읽으면 가장 빠르게 시작할 수 있습니다.

| 순서 | 문서 | 무엇을 설명하나요? |
| --- | --- | --- |
| 1 | [docs/setup-guide.md](docs/setup-guide.md) | 설치 → 실행 → 빌드 따라 하기 |
| 2 | [docs/project-guide.md](docs/project-guide.md) | 프로젝트 구조와 코드를 둘 위치 |
| 3 | [../../docs/code-quality-guide.md](../../docs/code-quality-guide.md) | Biome·Git 훅·CI 등 코드 품질 |
| 4 | [docs/git-strategy.md](docs/git-strategy.md) | 브랜치·커밋·PR 올리는 방법 |

참고 문서: [docs/HANDOFF.md](docs/HANDOFF.md) (평가/인수인계),
[docs/QA_HARNESS.md](docs/QA_HARNESS.md) (수동 점검),
[docs/RISKS_AND_NOTES.md](docs/RISKS_AND_NOTES.md) (위험·메모),
[docs/REFERENCES.md](docs/REFERENCES.md) (에셋·비주얼 방향),
[../../docs/PROJECT_STRUCTURE.md](../../docs/PROJECT_STRUCTURE.md) (작업 공간 전체 구조).

## Quick Start

Requirements:

- Node.js 20+ recommended
- npm 10+ recommended
- Godot 4.x for editing/exporting the iframe content

Install and run the React web shell:

```bash
npm install
npm run dev
```

From the workspace root:

```bash
npm run web:install
npm run web:dev
```

AI TODO integration:

AI features are provided by the separate `mongle-ai` service. The TODO input's `AI 정리` button calls `VITE_AI_API_BASE` (default `http://127.0.0.1:8010`), e.g. `/api/todos/split`.
If that service is not running, the React app keeps working and uses the local fallback splitter.

Environment values for the web shell can be copied from `.env.example`:

```bash
cp .env.example .env.local
```

- `VITE_GODOT_EXPORT_PATH` controls the iframe URL for the Godot Web export.
- `VITE_AI_API_BASE` controls the local AI API base URL.

Export the Godot screen for the iframe:

```bash
npm run godot:export
```

The export writes to `public/godot/index.html`, which the React app embeds at `/godot/index.html`.

## What Is Implemented

- React/Vite shell with a full-viewport iframe.
- Godot project with a single main village scene under `godot/`.
- Configurable Vite environment values for the Godot iframe path and the AI API base URL.
- Pixel village map with grass, paths, houses, trees, water, fences, flowers, props, NPCs, and clickable buildings.
- Focus timer with start, pause, and reset.
- Todo list with add, complete toggle, and Godot `user://` persistence.
- AI TODO splitting through the external `mongle-ai` API.
- NPC/building selection card and bottom dialogue panel.
- Pixel-style HUD with nearest-neighbor rendering.

## Project Structure

```text
.
├── project.godot
├── export_presets.cfg
├── scenes/
│   └── main.tscn
├── scripts/
│   └── village.gd
├── godot/
│   ├── project.godot
│   ├── scenes/
│   ├── scripts/
│   └── assets/
├── public/godot/
├── src/
├── docs/
├── legacy/
└── ASSET_CREDITS.md
```

## Assets And References

Runtime assets:

- `godot/assets/grass_tileset/`
- `godot/assets/lpc-flowers-plants-fungi-wood/`
- `godot/assets/lpc-terrains/`
- `godot/assets/submission_daneeklu/`
- See `ASSET_CREDITS.md` and `docs/REFERENCES.md`

Archived reference material:

- `legacy/reference/reference-screenshot.png`
- `legacy/vendor/kenney/`
- `legacy/plans/original-plan.md`

## Known Limitations

- The visual style is still prototype-level and mixes atlas sprites with simple Godot-drawn houses/NPCs.
- There is no player movement yet; this MVP is a clickable focus/todo village screen.
- No server sync, account system, audio, mobile app packaging, or multiplayer.
- `user://` is used for todos inside the Godot iframe, so data stays local to that runtime/profile.

## Recommended Next Steps

- Replace generated sprites with a cohesive dedicated tile pack or custom pixel art.
- Add a player character and path/collision movement.
- Move map composition into a Godot TileMap/TileSet for easier level design.
- Add ambient animation: water shimmer, chimney smoke, NPC idle frames, flower sway.
- Add visual regression screenshots for desktop and mobile sizes.
