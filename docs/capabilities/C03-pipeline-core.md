# C03 — Pipeline Core

- **Status**: Completed
- **Capability ID**: C03
- **Capability Name**: Pipeline Core

---

## Objective

Build the core Atlas Pipeline Framework — the backbone through which every transformation (image upload to immersive viewer) executes. This capability establishes the reusable architecture; future capabilities plug into it.

## Scope

- Create `@atlas/pipeline` package with a clean public API.
- Support sequential async stages with shared context.
- Lightweight event system for pipeline lifecycle events.
- Minimal logging interface (console implementation).
- Cancellation-ready design (AbortSignal/AbortController).
- Progress reporting.
- Comprehensive unit tests.

## Deliverables

1. `@atlas/pipeline` package
2. Pipeline engine with stage registration and sequential execution
3. Shared execution context (`PipelineContext`)
4. Event system (`PipelineEvent`, listener management)
5. Logging interface + `ConsoleLogger`
6. Unit tests covering execution order, error handling, context propagation, cancellation
7. Capability documentation (this file)

## Architecture Decisions

### Package placement

Created as `packages/pipeline/` — a standalone package in the monorepo. This follows the existing pattern (`@atlas/shared`, `@atlas/config`, etc.) and makes the framework independently testable and consumable by any other package or the web app.

### Composition over inheritance

- `Pipeline` is a class, but stages are plain objects implementing the `PipelineStage` interface — no base class to extend.
- The event system is a simple `Map<string, Set<listener>>` pattern rather than extending `EventEmitter` or pulling in a library.
- Context is a lightweight class wrapping a `Map<string, unknown>` with typed accessors.

### AbortSignal for cancellation

Uses the web-standard `AbortController`/`AbortSignal` API. This is framework-agnostic, works in both Node and browser, and integrates naturally with `fetch`, `setTimeout`, and any future async operations. No custom cancellation tokens needed.

### Logger as interface

The `PipelineLogger` interface is a minimal contract (`info`, `warn`, `error`). The included `ConsoleLogger` delegates to `console`. Future implementations can target file systems, monitoring services, or the sandbox log panel without changing the pipeline engine.

### Event types

String literal union types for event names (`"pipeline:started"`, `"stage:started"`, etc.) with typed payloads. No enum — string unions compose better and avoid the verbosity of `enum` in isolated modules.

## Future Considerations

- Parallel stage execution (when the pipeline graph supports DAGs)
- Stage dependency declarations (stage B requires stage A's output)
- Pipeline branching / conditional stages
- Built-in retry policies per stage
- Timing and performance metrics per stage
- Persistent pipeline history / replay
- Integration with `@atlas/web` sandbox for visual pipeline monitoring

## Status

- **Planned** — initial spec written
- **In Progress** — implementation underway
- **Completed** — implementation verified (lint, typecheck, build, test pass)

Current status: **Completed**
