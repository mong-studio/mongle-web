# Project Structure

## Current Layout

```text
.
├── apps/
│   └── game/                      # React shell embedding Godot Web export
├── package.json                   # Root convenience scripts
└── docs/                          # Workspace-level notes
```

This repository is the **frontend** workspace. AI features are provided by the
separate `mongle-ai` service, which the web app calls over HTTP.

## Runtime Boundary

The projects are integrated in one workspace but keep separate runtimes.

The frontend should own:

- React/Vite app shell
- iframe embedding for the Godot Web export
- Vite environment values for web-facing paths and local API URLs
- Godot scene and project settings under `godot/`
- village screen rendering inside Godot
- web shell interactions around the game frame
- local UI state
- calls to local/API endpoints

The separate `mongle-ai` service owns:

- character generation
- TODO parsing and planning
- quest assignment
- feed generation
- AI model rules, schemas, tests, and adapters
- the HTTP API the game integrates with

## Current Integration Path

The web app calls the `mongle-ai` HTTP API. The base URL is configured through
`VITE_AI_API_BASE` (default `http://127.0.0.1:8010`).

```text
apps/game React shell
  -> iframe /godot/index.html
    -> apps/game/godot Godot Web export
  -> fetch VITE_AI_API_BASE/api/todos/split
    -> mongle-ai service (separate repo/runtime)
```

This keeps the web shell free from AI runtime details while allowing the UI to use the real AI features.
The React app also has local fallback behavior, so the web shell remains usable when the AI API is not running.

## Root Commands

```bash
npm run web:install    # install the React/Vite app dependencies
npm run web:dev        # run the React shell
npm run web:typecheck  # run TypeScript checks
npm run web:build      # typecheck and build the Vite app
npm run web:godot      # open the Godot project
npm run web:godot:export
```

## Why `apps/game`

Keeping the web shell under `apps/game` leaves room for additional frontend
apps or shared `packages/` later, without mixing the React/Vite/Godot toolchain
into the repository root.

- `package.json`, React source, and Vite config belong to the web shell.
- `godot/project.godot`, scenes, scripts, and runtime assets belong to the Godot app.

AI code, tests, and deployment live in the separate `mongle-ai` repository, so
no Python toolchain is needed to work in this repo.
