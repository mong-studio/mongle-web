# Project Structure

## Current Layout

```text
.
├── apps/
│   └── game/                      # Phaser/Vite browser game
├── packages/
│   └── ai/                        # Python AI/domain package + local API
├── package.json                   # Root convenience scripts
└── docs/                          # Workspace-level notes
```

## Runtime Boundary

The projects are integrated in one workspace but keep separate runtimes.

The frontend should own:

- Phaser/Vite app shell
- village screen rendering
- browser interactions
- client-side UI state
- calls to local/API endpoints

The AI/domain project should own:

- character generation
- TODO parsing and planning
- quest assignment
- feed generation
- AI model rules, schemas, tests, and adapters
- local HTTP API wrappers for game integration

## Current Integration Path

A small local API layer connects the game screen to the Python agents.

```text
apps/game Phaser screen
  -> http://127.0.0.1:8010/api/todos/split
    -> packages/ai agents.todo_creation.single_turn
      -> model/storage adapters
```

This keeps the screen implementation free from Python runtime details while allowing the UI to use the real AI features.

## Why Not Flatten More

Putting TypeScript/Vite files directly inside the Python package would blur package ownership:

- `package.json`, `tsconfig.json`, and Vite assets belong to the browser app.
- `pyproject.toml`, `uv.lock`, `agents/`, and `tests/` belong to the Python app.
- Tests and build commands are different.
- Deployment will likely be different.

The `apps/` and `packages/` layout gives one clean directory tree without forcing unrelated toolchains into the same package.

## Git Note

`packages/ai/` currently contains its own `.git` directory and uncommitted work inherited from the original AI folder. Do not delete or flatten that repository until its changes are committed or intentionally migrated into the root repository.
