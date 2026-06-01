# QA Harness

This project does not yet have automated Playwright tests. Until those are added, use this manual harness after meaningful changes.

## Build Harness

```bash
npm run godot:export --prefix apps/game
npm run web:build
```

Pass condition:

- Godot loads the project under `apps/game/godot`.
- Web export completes when export templates are installed.
- React/Vite build completes.
- No runtime assets are missing from `godot/assets/`.

## Browser Harness

Run:

```bash
npm run web:dev
```

Check:

- The iframe renders a nonblank Godot pixel village.
- Timer starts, changes to pause, and reset works.
- Todo input adds an item with `+` or Enter.
- Todo complete toggle works.
- Todo remains after restarting the Godot run.
- NPC/building click changes dialogue and card text.

## Visual Harness

Inspect at:

- Desktop: around 1366x768
- Laptop: around 1280x800
- Narrow/mobile-ish: around 390px wide

Check:

- Pixel art is crisp, not blurry.
- HUD panels remain readable.
- Bottom dialogue does not hide all important map content.
- Top-left and top-right panels do not collide.
- No obvious empty or placeholder-looking areas.
- Houses, trees, props, and UI feel like one palette.

## Future Automation

Recommended future tests:

- Playwright screenshot smoke test at desktop and mobile widths.
- Canvas nonblank pixel sample.
- UI checks for timer, todos, and dialogue.
- `user://` persistence test.
