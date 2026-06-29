# ADR-0001: Monorepo Architecture

- **Status**: Accepted
- **Date**: 2025-06-29

## Context

Atlas is a spatial computing platform composed of multiple packages: a web application, engine libraries, shared utilities, and UI components. These packages share types, utilities, and build tooling but have distinct concerns and release cadences.

A monorepo was chosen to simplify cross-package development, enforce consistent tooling, and maintain a single source of truth for shared dependencies.

## Decision

Use a pnpm workspace monorepo with Turborepo for task orchestration.

- **pnpm workspaces** for package linking and strict dependency resolution.
- **Turborepo** for parallel builds, caching, and dependency-aware task execution.
- Each package has its own `tsconfig.json`, `package.json`, and build script.
- Root configuration (`tsconfig.json`, `eslint.config.js`, `turbo.json`) provides shared defaults.

## Consequences

- Cross-package imports resolve via workspace protocol (`workspace:*`).
- Shared TypeScript strict settings apply to all packages via `extends`.
- Build order is enforced by Turbo's `dependsOn` graph.
- Adding a new package requires updating `pnpm-workspace.yaml` and root `tsconfig.json` references.
