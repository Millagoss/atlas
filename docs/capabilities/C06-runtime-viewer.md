# Engineering Brief

**ID:** C06

**Title:** Runtime Viewer

**Status:** Planned

---

# Objective

Implement the first functional Atlas Runtime Viewer.

The Runtime Viewer is responsible for visualizing a `SpatialScene` produced by the pipeline.

The objective of this capability is **not** realism or visual polish.

The objective is to prove that Atlas can render its canonical scene representation inside the browser.

---

# Background

Atlas now produces the following flow:

Image
↓

ImageAsset
↓

MockDepthProvider
↓

SpatialScene

The next step is to visualize that SpatialScene.

This viewer will become the foundation for all future rendering capabilities.

---

# Requirements

Implement a reusable Viewer Engine.

The Viewer Engine should remain independent from React.

React is responsible only for hosting the viewer.

The rendering engine should expose a clean API that accepts a `SpatialScene`.

---

## Rendering

Use Three.js as the rendering engine.

Render a basic scene representing the generated `SpatialScene`.

Rendering may initially be simplistic.

The objective is correctness rather than realism.

---

## Viewer Host

Create a lightweight React component responsible only for:

- creating the viewer
- mounting the canvas
- passing the SpatialScene
- disposing resources correctly

Do not place rendering logic inside React components.

---

## Scene Updates

The Viewer should react to updates from the Sandbox.

Whenever a new `SpatialScene` is produced:

- dispose the previous scene safely
- render the new scene

Avoid unnecessary viewer recreation.

---

## Lifecycle

Support:

- initialization
- scene loading
- scene replacement
- cleanup

Memory leaks should be avoided.

---

## Pipeline Inspector

Enhance the Sandbox with a simple Pipeline Inspector.

Display:

- completed pipeline stages
- current stage
- execution duration
- success or failure

The implementation should remain lightweight.

---

## Logging

Log major viewer lifecycle events:

- Viewer Initialized
- Scene Loaded
- Scene Updated
- Scene Disposed

Console logging is sufficient.

---

## Testing

Add tests where practical for:

- Viewer initialization
- Scene loading
- Scene replacement
- Viewer disposal

Rendering correctness does not need visual snapshot testing.

---

# Constraints

Do not implement:

- Camera controls
- Orbit controls
- First-person movement
- AI inference
- Lighting optimization
- Post-processing
- Shadows
- HDR environments
- Performance optimization

Focus exclusively on rendering a valid SpatialScene.

---

# Acceptance Criteria

The capability is complete when:

- The Sandbox displays a working viewer.
- A SpatialScene is rendered successfully.
- Updating the SpatialScene refreshes the viewer.
- Viewer resources are disposed correctly.
- Pipeline Inspector displays execution progress.
- Build, lint, typecheck and tests pass.

---

# Manual Verification

Verify the following flow:

1. Open the Sandbox.
2. Upload an image.
3. Confirm the pipeline executes.
4. Confirm a SpatialScene is generated.
5. Confirm the Viewer renders the SpatialScene.
6. Upload a second image.
7. Confirm the Viewer replaces the previous scene.
8. Confirm no runtime errors or resource leaks occur.

---

# Deliverables

- Viewer Engine
- Viewer Host
- Three.js integration
- Runtime rendering
- Pipeline Inspector
- Updated capability documentation

Stop after completing this capability.
