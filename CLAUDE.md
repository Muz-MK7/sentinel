# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SENTINEL** is a real-time process and server health monitoring tool published as `@muz-mk7/sentinel` on npm. The repo is a monorepo with two sub-projects:

- `sentinel-cli/` — the CLI tool (Node.js + TypeScript)
- `sentinel/` — the marketing landing page (Next.js 16 + React 19 + Tailwind v4)

## Commands

### sentinel-cli
```bash
cd sentinel-cli
npm run build   # compile TypeScript → dist/
npm run dev     # watch-mode compilation
npm start       # run compiled CLI (node dist/index.js)
```

There is no test runner configured. To exercise the CLI manually after building:
```bash
node dist/index.js watch <process-name>
node dist/index.js init
```

### sentinel (landing page)
```bash
cd sentinel
npm run dev     # dev server at localhost:3000
npm run build   # production build
npm run lint    # ESLint
```

## Architecture

### sentinel-cli

Four source files under `src/`:

| File | Role |
|------|------|
| `index.ts` | CLI entry — defines `watch` and `init` commands via commander |
| `config.ts` | Loads `sentinel.config.toml` from CWD, falls back to `~/.sentinel/sentinel.config.toml` |
| `alerts.ts` | Builds and dispatches Slack / generic webhook alerts with a defined `AlertPayload` shape |
| `dashboard.ts` | Multi-process live table rendered with ANSI escape codes |

**Watch command modes:**
- Single target → inline scrolling output in `index.ts`
- Multiple targets → delegates to `runDashboard()` in `dashboard.ts`

**Alert cooldown:** 60 seconds per process/metric — enforced in both `index.ts` and `dashboard.ts` via a `lastAlertTime` timestamp.

**Config resolution order:** CLI flags → `sentinel.config.toml` in CWD → `~/.sentinel/sentinel.config.toml` → hardcoded defaults (80% CPU threshold, 1s interval).

### sentinel (landing page)

Single-page Next.js app (`app/page.tsx`, ~550 lines). All UI components are defined inline in that file as small client-side React components (cursor tracker, live clock, animated counter, status badge, feature cards, install steps). The design uses a retro terminal/blueprint aesthetic — dark background (`#0D0D0D`), orange accent (`#FF5F1F`), green status (`#00FF41`), Space Grotesk + JetBrains Mono fonts.

Custom visual effects (scanlines, chamfered corners, blueprint grid, glitch hover) are defined as utility classes in `app/globals.css`.
