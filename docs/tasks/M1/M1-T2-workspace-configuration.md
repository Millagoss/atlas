# Task M1-T2: Workspace Configuration

- **Task ID**: M1-T2
- **Milestone**: M1 — Project Foundation
- **Status**: Completed

## Goal

Configure the Atlas workspace so every package behaves like a first-class workspace package.

## Requirements

1. **TypeScript** — Strict mode, project references, incremental compilation, independent package builds, consistent path aliases.
2. **Package Exports** — Single public API via `src/index.ts` per package. No internal file imports.
3. **Build Configuration** — Independent builds, correct Turborepo caching, proper build ordering.
4. **Environment Management** — `.env.example` with placeholder variables.
5. **Repository Standards** — `.editorconfig` (UTF-8, LF, 2-space indent), MIT `LICENSE`.
6. **Dependency Review** — No duplicates, shared deps correctly placed, packages only depend on what they use.

## Deliverables

- [x] Improved TypeScript workspace configuration
- [x] Verified package boundaries
- [x] `.env.example`
- [x] `.editorconfig`
- [x] `LICENSE`
- [x] Clean dependency graph
- [x] Updated task document

## Acceptance Criteria

- [x] All packages compile independently
- [x] Cross-package imports use aliases only
- [x] Turborepo builds successfully
- [x] TypeScript passes with no errors
- [x] Workspace configuration is documented
- [x] Task documentation updated to Completed

## Summary

### TypeScript Configuration

- Root `tsconfig.json`: strict mode, composite, incremental, ESNext modules — confirmed correct.
- `apps/web/tsconfig.json`: Added `paths` for `@atlas/shared`, `@atlas/config`, `@atlas/ui` and project `references` for dependent packages.
- Package tsconfigs all extend root with self-referencing paths.

### Package Exports

- Removed subpath exports (`./utils`, `./types`) from `@atlas/shared` — all consumers now import from `@atlas/shared` only.
- Every package exposes a single public API via `src/index.ts`.

### Build Configuration

- `turbo.json` build task depends on `^build` (upstream), ensuring correct build order.
- Dev task has `cache: false` + `persistent: true` (prevents unnecessary rebuilds).
- All 7 packages build and typecheck successfully with Turborepo caching.

### Environment Management

- Created `.env.example` with `VITE_APP_NAME`, `NODE_ENV`, `WEB_URL` placeholders.

### Repository Standards

- Created `.editorconfig`: UTF-8, LF, 2-space indent, final newline, trimmed trailing whitespace (except Markdown).
- Created `LICENSE` (MIT).

### Dependency Review

- Aligned `vitest` version in `apps/web` to `^2.1.8` (matched root).
- Added `"type": "module"` to root `package.json` to suppress ESLint module warnings.
- Fixed lint error in `packages/config/src/index.ts` (unnecessary `??` after type assertion).

### Bug Fix

- Fixed CSS import path in `apps/web/app/routes/__root.tsx`: `../app/globals.css` → `../globals.css`.

### Verification

- `pnpm run typecheck` — 7/7 pass
- `pnpm run build` — 7/7 pass
- `pnpm run lint` — 7/7 pass
- `pnpm run test` — 3/3 tests pass (cross-package imports verified)

### Files Created

- `docs/tasks/M1/M1-T2-workspace-configuration.md`
- `.env.example`
- `.editorconfig`
- `LICENSE`

### Files Modified

- `packages/shared/package.json` — removed subpath exports
- `packages/shared/tsconfig.json` — simplified paths
- `apps/web/tsconfig.json` — added paths and project references
- `apps/web/package.json` — aligned vitest version
- `apps/web/app/routes/__root.tsx` — fixed CSS import path
- `package.json` — added `"type": "module"`
- `packages/config/src/index.ts` — fixed lint error

### Architectural Decisions

- Path aliases configured in `apps/web/tsconfig.json` point directly to package source (not dist), enabling type resolution without requiring a full build first.
- `@atlas/shared` subpath exports removed to enforce single public API principle.
- `"type": "module"` added to root despite it being `"private": true` to suppress Node.js warnings from ESLint config resolution.

### Future Considerations

- `tooling/` and `workers/` directories are empty scaffolding — populate when those concerns are needed.
- Consider adding `tsconfig` path aliases to `apps/web/vitest.config.ts` if tests need to resolve `@atlas/*` without the pnpm workspace symlink.
- `@atlas/config` uses `process.env` directly — consider a formal env validation layer in a future task.
