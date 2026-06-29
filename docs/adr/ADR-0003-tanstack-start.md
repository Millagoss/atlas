# ADR-0003: TanStack Start

- **Status**: Accepted
- **Date**: 2025-06-29

## Context

Atlas needs a web application framework that supports server-side rendering, file-based routing, and integrates with React 19. The framework should work well within a pnpm monorepo and support modern tooling (Vite, TypeScript, Tailwind CSS).

## Decision

Use TanStack Start (beta) with TanStack Router for the `@atlas/web` application.

- **TanStack Start** provides SSR, streaming, and server functions with Vite.
- **TanStack Router** offers type-safe, file-based routing with layout support.
- **Vite** serves as the dev server and build tool.
- React 19 is the UI framework with React Server Components support.

## Consequences

- TanStack Start is in beta; breaking changes may occur between releases.
- Route tree is auto-generated (`routeTree.gen.ts`) and should not be edited manually.
- The `@atlas/web` package uses `composite: false` in tsconfig since it's an application, not a library.
- Path aliases resolve `@atlas/*` packages directly to source for fast iteration.
