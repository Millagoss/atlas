# M1-S2: Complete Project Foundation

- **Sprint ID**: M1-S2
- **Milestone**: M1 — Project Foundation
- **Status**: Completed

## Objective

Complete all remaining engineering foundation work so Atlas has a production-quality repository ready for feature development.

## Scope

- Repository standards audit and cleanup
- Documentation improvements
- Architecture Decision Records
- Repository health review
- Workspace validation

## Deliverables

- [x] Repository cleanup and standardization
- [x] Root README.md
- [x] ADR documents
- [x] Improved package README files
- [x] Verification pass (lint, typecheck, build, test, format)

## Files Changed

### Created

- `README.md` — Root monorepo README with package overview, commands, and architecture summary
- `docs/adr/ADR-0001-monorepo-architecture.md` — pnpm workspaces + Turborepo decision
- `docs/adr/ADR-0002-package-boundaries.md` — Single barrel export per package decision
- `docs/adr/ADR-0003-tanstack-start.md` — TanStack Start + React 19 framework decision
- `docs/tasks/M1/M1-S2-complete-project-foundation.md` — This sprint document

### Updated

- `packages/ai-engine/README.md` — Added dependencies section
- `packages/config/README.md` — Added dependencies section
- `packages/scene-engine/README.md` — Added dependencies section
- `packages/shared/README.md` — Added dependencies section
- `packages/ui/README.md` — Added dependencies section
- `packages/viewer-engine/README.md` — Added dependencies section

### Formatted (pre-existing files with minor whitespace/formatting fixes)

- `apps/web/app/routes/__root.tsx`
- `apps/web/app/routes/index.tsx`
- `apps/web/app/routeTree.gen.ts`
- `docs/tasks/M1/M1-T1-Project-initialization.md`
- `docs/tasks/M1/M1-T2-workspace-configuration.md`
- `packages/shared/src/types/index.ts`

## Verification Results

```
format:check — PASS (all files conform to Prettier)
lint       — PASS (10/10 tasks)
typecheck  — PASS (10/10 tasks)
build      — PASS (7/7 packages)
test       — PASS (3/3 tests in @atlas/web)
```

Turbo cache was cleared between runs to ensure fresh execution. All tasks completed without errors.

## Architecture Notes

### Repository Structure

- 7 packages in the monorepo: 1 app (`@atlas/web`), 3 engine libraries (`ai-engine`, `scene-engine`, `viewer-engine`), 3 support libraries (`shared`, `config`, `ui`).
- Empty scaffold directories `tooling/` and `workers/` are listed in `pnpm-workspace.yaml` but contain no packages yet — ready for future expansion.
- All packages use `"type": "module"` (ESM) with `"exports"` field for resolution.
- Root `tsconfig.json` provides shared strict TypeScript settings via `extends`.

### Dependency Graph

- `@atlas/web` → `@atlas/config`, `@atlas/shared`, `@atlas/ui`
- No cross-dependencies among library packages
- No circular dependencies
- `@atlas/ui` declares `react` and `react-dom` as peer dependencies
- `@atlas/config` depends on `@types/node` (dev) for `process.env` types

### Configuration Consistency

- All 8 `tsconfig.json` files extend root, set `outDir: ./dist`, `rootDir: ./src` (except `apps/web` which uses `rootDir: .`)
- `apps/web` uses `composite: false` (application, not library)
- All `package.json` files follow identical structure: `name`, `version: 0.0.0`, `private: true`, `type: module`, `exports`, `scripts`
- Scripts are standardized: `build` (tsc), `typecheck` (tsc --noEmit), `lint` (eslint src/) across all library packages
- `@atlas/web` uses `vite build` for build, `vitest run` for test

### Lint & Format Pipeline

- ESLint v9 flat config with typescript-eslint strict + stylistic type-checked, prettier
- Prettier: 2-space indent, double quotes, trailing commas, LF line endings
- Husky pre-commit: `format:check` → `lint` → `typecheck`
- lint-staged: prettier + eslint (--fix --max-warnings=0) for TS/JS, prettier only for JSON/CSS/MD/YAML
- CI workflow (`.github/workflows/ci.yml`): install → lint → typecheck → build → test → e2e (Playwright)

## Future Considerations

- **Engine packages are placeholders** — `@atlas/ai-engine`, `@atlas/scene-engine`, and `@atlas/viewer-engine` contain minimal stub implementations. Full API design and implementation occurs in future milestones.
- **`@atlas/ui` inline Tailwind** — Currently uses Tailwind utility classes directly. Consider a design token layer when the component library grows.
- **`@atlas/config` env access** — Uses `process.env` directly. A formal env validation layer (e.g., Zod) should be added before production use.
- **`noop` utility** — Exported from `@atlas/shared` but not yet consumed. Keep it; it's a standard utility that will be used during feature development.
- **`ENGINE_NAME` constants** — Exported from each engine package but not consumed. These are lightweight placeholders that will be relevant when engine lifecycle management is implemented.
- **`tooling/` and `workers/` directories** — Exist only as `.gitkeep` scaffolds. Populate when shared tooling (e.g., custom ESLint configs, build plugins) or worker processes (e.g., background jobs) are needed.
- **Path aliases in `apps/web`** — Point directly to package source (`../../packages/*/src/index.ts`) for dev convenience. This works via `vite-tsconfig-paths` but relies on direct file access rather than package resolution. Not a problem at this scale, but worth noting.
- **E2E tests require running dev server** — Playwright starts the dev server automatically but tests will be fleshed out as features are added.
