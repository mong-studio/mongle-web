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

Current runtime third-party assets are listed in `ASSET_CREDITS.md`. The Godot scene primarily uses:

- `godot/assets/grass_tileset/`
- `godot/assets/lpc-flowers-plants-fungi-wood/`
- `godot/assets/lpc-terrains/`
- `godot/assets/submission_daneeklu/`

## Technical Risk

- Godot Web export requires local export templates and should be checked inside the React iframe, not only editor play mode.
- The map is currently assembled in `godot/scripts/village.gd`; a larger game should move to Godot TileMap/TileSet resources.
- Todos use `user://`; clearing the Godot app/profile data deletes them.
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
