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