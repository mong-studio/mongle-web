# Risks And Notes

## Visual Risk

The biggest product risk is graphics quality. The current version is more polished than the first pass, but it is still generated/prototype art. If the goal is close to a commercial cozy farming RPG, replace generated buildings, characters, and props with a cohesive tile pack or custom art.

Avoid mixing many free packs without normalization. Different packs often disagree on:

- Tile size
- Perspective
- Outline thickness
- Shadow direction
- Saturation and contrast
- Character scale

## Legal / Asset Risk

Do not copy or trace the reference screenshot. It is archived only as visual direction. Use assets with clear licenses and record every source.

Current runtime third-party asset:

- Kenney Roguelike/RPG Pack, CC0

## Technical Risk

- Phaser adds a large JavaScript bundle. This is fine for MVP, but production may need chunking or lazy loading.
- The map is currently hardcoded in `src/main.ts`; a larger game should move to Tiled JSON.
- Todos use `localStorage`; clearing browser data deletes them.
- There is no save schema migration because the stored data is tiny and local-only.
- No collision/player controller exists yet.

## UX Risk

The UI sits on top of the map, which can hide content on small screens. Keep new HUD panels compact and test narrow widths.

## Recommended Art Upgrade Path

1. Pick one main tileset and treat it as the style source of truth.
2. Convert all runtime art to the same tile size.
3. Replace generated houses and NPCs first; they determine perceived quality.
4. Add idle animation and water/chimney effects.
5. Move decorative placement to a real map editor.
