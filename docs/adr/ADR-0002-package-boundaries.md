# ADR-0002: Package Boundaries

- **Status**: Accepted
- **Date**: 2025-06-29

## Context

The Atlas monorepo contains library packages (`ai-engine`, `scene-engine`, `viewer-engine`, `shared`, `config`, `ui`) and an application package (`web`). Without clear boundaries, packages risk tight coupling, circular dependencies, and leaking internal implementation details.

## Decision

Each package exposes a single public API through `src/index.ts` (barrel export). Consumers import only from the package root.

- Package imports use the package name (`@atlas/shared`), never relative paths into `src/`.
- Subpath exports are prohibited — the barrel is the only public surface.
- Each package is `"private": true` and consumed as source via `"exports"` field.
- Packages have zero or minimal dependencies on other workspace packages.

## Consequences

- Internal refactors within a package do not break consumers.
- Package READMEs document the public API surface.
- New package features require explicit export from the barrel.
- `@atlas/web` depends on `@atlas/config`, `@atlas/shared`, and `@atlas/ui`.
- Library packages have no cross-dependencies, keeping the graph flat.
