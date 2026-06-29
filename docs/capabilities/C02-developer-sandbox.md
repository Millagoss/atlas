# C02 — Developer Sandbox

- **Status**: Completed
- **Capability ID**: C02
- **Capability Name**: Developer Sandbox

---

## Objective

Build the internal Atlas Developer Sandbox — an application for inspecting, debugging, validating, and visualizing every stage of the Atlas spatial pipeline. It serves as the primary development interface for AI, scene generation, and rendering work. The interface is intentionally minimal, prioritizing functionality and extensibility over appearance.

## Scope

- Create a dedicated sandbox page using TanStack Start.
- Placeholder panels for each pipeline stage: Original Image, Processed Image, Depth Map, SpatialScene, Runtime Viewer, Logs.
- Shared sandbox state store representing the full pipeline.
- Minimal developer toolbar with Clear State and Reset Sandbox actions.
- Responsive but visually simple layout.
- No backend, storage, AI inference, Three.js, or authentication integration.

## Deliverables

1. Sandbox page (`/sandbox` route)
2. Pipeline state store (React Context + useReducer)
3. Reusable panel components:
   - `SandboxLayout` — grid layout orchestrator
   - `PipelinePanel` — generic pipeline stage panel with title and placeholder
   - `LogsPanel` — log output panel consuming sandbox state
   - `PlaceholderPanel` — fallback placeholder panel
   - `DevToolbar` — developer actions (Clear State, Reset Sandbox)
4. Capability documentation (this file)

## Architecture Notes

### State Management: React Context + useReducer

Chosen over external libraries (Zustand, Jotai, TanStack Store) for the following reasons:

- **Zero dependencies** — no additional packages required. The project already depends on React 19, which provides `useReducer` and `createContext` out of the box.
- **TanStack Start agnostic** — Context + useReducer has no framework-specific integration requirements. It works identically on both server and client renders.
- **Scalable composition** — reducers compose naturally via nested providers or combined reducers as the pipeline grows. Each pipeline stage can own its reducer slice without refactoring the store.
- **Explicit dispatch** — reducer actions provide a clear audit trail for debugging pipeline state transitions, which aligns with the sandbox's inspection purpose.
- **TypeScript-native** — actions and state are fully typed with discriminated unions, no library-specific type machinery needed.

### Component Boundaries

- Components live under `apps/web/app/components/sandbox/` — app-specific, not shared across packages.
- Each component has a single responsibility and receives data via props or the sandbox context hook.
- No tight coupling: `PipelinePanel` and `LogsPanel` consume the same context but have no direct dependencies on each other.
- The `SandboxProvider` wraps the route component, scoping sandbox state to the sandbox page only.

### Routing

- Dedicated route at `/sandbox` via TanStack Start file-based routing.
- Index route (`/`) redirects to `/sandbox` during development, making the sandbox the default landing page.
- Future routes (e.g., property marketplace) will be added alongside `/sandbox` without conflict.

## Future Extensions

- Replace placeholder panels with real image, depth map, and 3D scene renderers.
- Add image upload and AI inference triggers.
- Integrate with `@atlas/ai-engine`, `@atlas/scene-engine`, and `@atlas/viewer-engine` packages.
- Add pipeline step-by-step execution controls (play, pause, step).
- Add export/import of sandbox state for reproducible debugging sessions.
- Add performance profiling overlays per pipeline stage.

## Status

- **Planned** — initial spec written
- **In Progress** — implementation underway
- **Completed** — implementation verified (lint, typecheck, build, test pass)

Current status: **Completed**
