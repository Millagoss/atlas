# Engineering Brief

**ID:** C07

**Title:** Camera Navigation

**Status:** Planned

---

# Objective

Implement intuitive camera navigation for the Atlas Runtime Viewer.

This capability should allow a user to explore a rendered `SpatialScene` using familiar desktop controls.

The goal is to provide a smooth and predictable navigation experience suitable for inspecting generated scenes.

---

# Background

The Runtime Viewer can now render a `SpatialScene`.

The next step is enabling user interaction with that scene.

Camera navigation should remain independent from scene generation and rendering.

---

# Requirements

Implement camera controls within the Viewer Engine.

React should not contain navigation logic.

Support the following interactions:

- Mouse orbit
- Mouse pan
- Mouse wheel zoom

Choose an implementation that integrates naturally with Three.js and can be extended later if custom controls become necessary.

---

## Camera State

Maintain camera state inside the Viewer Engine.

Support:

- position
- target
- zoom (if applicable)

The camera should preserve its state while the current scene remains loaded.

---

## Scene Changes

When a new `SpatialScene` is loaded:

- reset the camera to a sensible default
- ensure the entire scene is visible

Avoid abrupt transitions that leave the user disoriented.

---

## Sandbox Integration

Add a simple Viewer Status panel displaying:

- camera position
- camera target
- current interaction mode

Keep the display minimal and intended for development only.

---

## Logging

Log major interaction events:

- Camera Initialized
- Camera Reset
- Scene Framed
- Navigation Started
- Navigation Ended

Console logging is sufficient.

---

## Testing

Add tests where practical for:

- camera initialization
- reset behavior
- scene replacement
- cleanup

---

# Constraints

Do not implement:

- first-person controls
- fly mode
- VR
- touch gestures
- keyboard movement
- animations
- cinematic transitions

Focus on desktop mouse interaction only.

---

# Acceptance Criteria

The capability is complete when:

- Users can orbit the scene.
- Users can pan the scene.
- Users can zoom the scene.
- Camera resets correctly when a new scene loads.
- Viewer Status updates correctly.
- Build, lint, typecheck and tests pass.

---

# Manual Verification

Verify the following flow:

1. Open the Sandbox.
2. Upload an image.
3. Wait for the scene to render.
4. Orbit the camera.
5. Pan the scene.
6. Zoom in and out.
7. Upload another image.
8. Confirm the camera resets correctly.
9. Confirm no runtime errors occur.

---

# Deliverables

- Camera navigation
- Viewer status panel
- Tests
- Updated capability documentation
