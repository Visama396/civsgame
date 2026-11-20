# Civsgame

A multiplayer strategy game about governing civilizations. Players act as the
head of state of an entire civilization, shaping its history through policy,
research, economy, and diplomacy while the world simulation runs underneath.

> ⚠ **Status: early development.** The project is currently a fresh scaffold
> while the game direction is being fleshed out.

## Tech Stack

- [Astro](https://astro.build) — static site + server routes
- [React](https://react.dev) — interactive UI components
- [Tailwind CSS](https://tailwindcss.com) — styling
- [Bun](https://bun.sh) — package manager and scripts

## Project Structure

```text
/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   └── Home.tsx        # Root React component (rendered on the home page)
│   ├── layouts/
│   │   └── Layout.astro    # HTML shell
│   ├── pages/
│   │   └── index.astro     # Home page
│   └── styles/
│       └── global.css      # Tailwind import
├── astro.config.mjs
└── package.json
```

Astro pages live in `src/pages/` — each file becomes a route based on its
name. Interactive components written in `.tsx` go in `src/components/` and are
mounted with `client:load` (or another client directive).

## Persistence

Civilizations are stored in Supabase's shared `game_progress` table — one row
per account and game slug (`civsgame`), with the full state as `jsonb`. The
client only calls the `load_game_progress` / `save_game_progress` RPCs, so the
account is resolved from the signed-in session server-side (no account id or
direct table access in the browser). Player actions (applying allocation,
starting research/builds, changing production) save immediately; simulation
ticks and the meal-interval slider are debounced. Writes are serialized, and a
pending save is flushed when the tab is hidden or closed.

The tick counter is not persisted. Each save records `foundedAt` and `savedAt`;
on load the tick is derived from those timestamps and every minute that passed
while the tab was closed is replayed through the simulation (capped at 90
days), so progression continues in real time.

## Commands

All commands run from the project root:

| Command                   | Action                                          |
| :------------------------ | :---------------------------------------------- |
| `bun install`             | Installs dependencies                           |
| `bun run dev`             | Starts the local dev server at `localhost:4321` |
| `bun run build`           | Builds the production site to `./dist/`         |
| `bun run preview`         | Previews the build locally, before deploying    |
| `bunx astro check`        | Type-checks the project                         |
| `bun run astro -- --help` | Get help with the Astro CLI                     |