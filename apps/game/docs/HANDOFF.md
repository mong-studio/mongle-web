# Handoff Notes

## Current State

The app is a single-screen Phaser 3 MVP with a DOM HUD. It is designed to be easy to run, inspect, and continue improving.

Implemented systems:

- Generated top-down village map.
- Clickable NPCs and buildings.
- Focus timer.
- Todo list with browser persistence.
- Pixel-style UI panels.
- Runtime Kenney CC0 spritesheet load.

## How To Evaluate It

1. Run `npm install`.
2. Run `npm run dev`.
3. Open `http://127.0.0.1:5173/`.
4. Check that the map is visible and pixel-sharp.
5. Click NPCs/buildings and confirm the center card and dialogue update.
6. Add a todo, reload, and confirm it persists.
7. Start and pause the timer.

## Files To Edit First

- Visual/map work: `src/main.ts`
- HUD layout: `src/style.css`
- External asset documentation: `ASSET_CREDITS.md`
- Project docs: `README.md`, `docs/*.md`

## Packaging For A Friend

Send the project folder without `node_modules` and `dist`. The recipient should run:

```bash
npm install
npm run dev
```

Keep `package-lock.json` included so dependency versions are reproducible.
