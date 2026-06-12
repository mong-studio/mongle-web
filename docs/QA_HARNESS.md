# QA Harness

This project does not yet have automated Playwright tests. Until those are added, use this manual harness after meaningful changes.

## Build Harness

```bash
npm run typecheck
npm run build
```

Pass condition:

- TypeScript passes.
- Vite build completes.
- No required map assets are missing from `public/assets/map/`.

## Browser Harness

Run:

```bash
npm run dev
```

Check:

- Phaser renders a nonblank pixel village.
- Timer starts, changes to pause, and reset works.
- Todo and quest controls still work.
- Village marker opens dialogue.
- Login/signup modals still open.

## Visual Harness

Inspect at:

- Desktop: around 1366x768
- Laptop: around 1280x800
- Narrow/mobile-ish: around 390px wide

Check:

- Pixel art is crisp, not blurry.
- HUD panels remain readable.
- Panels do not collide on narrow widths.
- No obvious empty or placeholder-looking areas.

## Future Automation

- Playwright screenshot smoke test at desktop and mobile widths.
- Canvas nonblank pixel sample.
- UI checks for timer, todos, and dialogue.
