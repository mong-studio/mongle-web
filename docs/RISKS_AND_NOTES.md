# Risks And Notes

## Visual Risk

The biggest product risk is graphics quality. Keep the map, characters, and UI in one coherent pixel-art style.

Avoid mixing many free packs without normalization. Different packs often disagree on:

- Tile size
- Perspective
- Outline thickness
- Shadow direction
- Saturation and contrast
- Character scale

## Asset Risk

Do not copy or trace archived reference screenshots. Use assets with clear licenses and record every source.

Runtime map assets live under:

```text
public/assets/map/
```

## Technical Risk

- Missing `.tsx` tileset files or `.png` images will leave parts of the map blank.
- Filename normalization can matter on macOS for Korean filenames. Keep `mongle.tmj` references exactly aligned with actual filenames.
- There is no collision/player controller yet.
- The current village click target is an interim marker.

## UX Risk

The UI sits on top of the map, which can hide content on small screens. Keep HUD panels compact and test narrow widths.
