# Handoff Notes

## Current State

The app is now a React/Vite shell that embeds the Godot screen in an iframe. The Godot scene is kept under `godot/` and exported to `public/godot/`.

Implemented systems:

- Godot-rendered top-down village map using runtime assets from `godot/assets/`.
- Clickable NPCs and buildings.
- Focus timer.
- Todo list with Godot `user://` persistence.
- Pixel-style UI panels.
- Local TODO splitting request to `http://127.0.0.1:8010/api/todos/split`.

## How To Evaluate It

1. Run `npm install --prefix apps/game`.
2. Export the Godot screen with `npm run godot:export --prefix apps/game`.
3. Run `npm run web:dev`.
4. Open `http://127.0.0.1:5173/`.
5. Check that the iframe shows the Godot map and stays pixel-sharp.
6. Click NPCs/buildings and confirm the card and dialogue update.
7. Add a todo, reload, and confirm it persists.
8. Start and pause the timer.

## Files To Edit First

- React iframe shell: `src/main.tsx`, `src/style.css`
- Visual/map work: `godot/scripts/village.gd`
- Scene shell: `godot/scenes/main.tscn`
- External asset documentation: `ASSET_CREDITS.md`
- Project docs: `README.md`, `docs/*.md`

## Packaging For A Friend

Send the project folder without `node_modules` and `dist`. The recipient should run:

```bash
npm install --prefix apps/game
npm run godot:export --prefix apps/game
npm run web:dev
```
