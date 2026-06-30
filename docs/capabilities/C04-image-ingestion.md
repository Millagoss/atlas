# Engineering Brief

**ID:** C04

**Title:** Image Ingestion

**Status:** Planned

---

# Objective

Implement the first complete end-to-end functional pipeline of Atlas.

This capability marks the transition from platform infrastructure to product functionality.

A user should be able to select an image from their device, after which Atlas will:

1. Validate the file.
2. Convert it into an immutable `ImageAsset`.
3. Register it in the Asset Registry.
4. Execute the Pipeline.
5. Reflect the current state inside the Developer Sandbox.

No AI processing or rendering is required at this stage.

---

# Background

Atlas is built around asset transformations.

The first transformation is:

File
↓

ImageAsset

This ImageAsset becomes the canonical representation used throughout the platform.

Every future capability will consume assets rather than browser-specific objects.

---

# Requirements

Implement the complete image ingestion workflow.

The workflow begins when a user selects an image.

Supported formats:

- JPEG
- PNG
- WEBP

Reject unsupported formats gracefully.

Reject empty files.

Reject corrupted files where detection is practical.

The implementation should produce clear errors without crashing the application.

---

## ImageAsset Creation

Convert the uploaded file into an immutable `ImageAsset`.

Populate all available metadata that is useful for downstream processing.

Examples include:

- unique identifier
- filename
- MIME type
- width
- height
- file size
- creation timestamp
- metadata

Do not perform image enhancement or AI preprocessing.

---

## Asset Registry

Implement a lightweight in-memory Asset Registry.

Responsibilities include:

- register assets
- retrieve assets
- remove assets
- clear registry
- query assets

The registry should become the single source of truth for assets during runtime.

The registry does not need persistence.

---

## Pipeline Integration

Submit the created `ImageAsset` into the existing Atlas Pipeline.

The pipeline may currently contain placeholder stages.

This capability should integrate with the existing pipeline architecture rather than bypass it.

---

## Sandbox Integration

Update the Developer Sandbox.

After successful ingestion the Sandbox should immediately display:

- Image preview
- Image metadata
- Asset identifier
- Pipeline execution status
- Registry status

The Sandbox is a developer tool.

Keep the interface minimal.

No design work is required.

---

## Logging

Log the major lifecycle events.

Example events include:

- File Selected
- Validation Passed
- ImageAsset Created
- Asset Registered
- Pipeline Started
- Pipeline Completed
- Pipeline Failed

Console logging is sufficient.

---

## Error Handling

Gracefully handle:

- unsupported file types
- oversized files (define a reasonable default)
- empty files
- unexpected failures

Display meaningful messages in the Sandbox.

The application must never crash because of user input.

---

## Testing

Add automated tests covering:

- successful ingestion
- unsupported formats
- invalid files
- registry operations
- pipeline execution
- metadata extraction

---

# Constraints

Do not implement:

- AI inference
- Depth estimation
- Image preprocessing
- Three.js
- Viewer rendering
- Storage providers
- Cloud uploads
- Authentication
- Database integration

Focus exclusively on image ingestion.

---

# Acceptance Criteria

This capability is complete when:

- A user can select a supported image.
- Atlas creates an immutable `ImageAsset`.
- The Asset Registry contains the asset.
- The Pipeline executes successfully.
- The Sandbox reflects the new state immediately.
- Logs display the ingestion lifecycle.
- All tests pass.
- Build, lint and typecheck succeed.

---

# Manual Verification

Verify the following flow manually:

1. Open the Sandbox.
2. Select a JPG, PNG or WEBP image.
3. Confirm an `ImageAsset` is created.
4. Confirm the Registry contains exactly one asset.
5. Confirm the Pipeline executes.
6. Confirm the Sandbox updates automatically.
7. Confirm logs display each pipeline step.
8. Confirm no runtime errors occur.

---

# Deliverables

- Image ingestion workflow
- Asset Registry
- Sandbox integration
- Pipeline integration
- Automated tests
- Updated capability documentation

Stop after completing this capability.

---

## Implementation Notes

- **Status**: Completed
- **Capability ID**: C04
- **Capability Name**: Image Ingestion

### File layout

**`@atlas/shared` — Asset Registry** (`src/registry/`)

- `AssetRegistry.ts` — in-memory `Map`-backed store: `register`, `get`, `has`,
  `remove`, `clear`, `size`, `all`, `query(predicate)`, `getByType(type)`.
  Re-exported from the shared barrel; 11 unit tests under `__tests__/`.

**`@atlas/web` — Image ingestion** (`app/ingestion/`)

- `constants.ts` — supported types (`image/jpeg`, `image/png`, `image/webp`),
  `MAX_IMAGE_FILE_SIZE` (25 MiB), `IMAGE_ASSET_CONTEXT_KEY`.
- `validate.ts` — `validateImageFile` accepts a structural `ImageFileInput`
  (`{ name, size, type }`), not the DOM `File`, so it is pure and trivially
  unit-testable. Rejects missing type, unsupported type, empty, oversized.
- `extract.ts` — `ImageMetadataExtractor` strategy interface plus
  `createBrowserImageExtractor` (object URL + `Image` for `naturalWidth/Height`;
  `onerror` gives practical corrupted-file detection).
- `stages.ts` — placeholder pipeline stages (`ingest-image`,
  `normalize-image`, `estimate-depth`) and `createIngestionPipeline()`,
  registered in canonical transformation order.
- `ingest.ts` — `ingestImage` orchestrator wiring validate → extract →
  `createImageAsset` → registry.register → pipeline.execute, emitting lifecycle
  logs and never throwing on bad input.
- `index.ts` — public barrel.

**`@atlas/web` — Sandbox integration**

- `app/stores/sandbox.tsx` — extended state: structured `LogEntry[]` (replacing
  `string[]`), plus `currentAsset`, `assetId`, `registryCount`,
  `pipelineStatus`, `pipelineError`, `ingestionError`, `isProcessing` and their
  actions.
- `app/stores/atlas.tsx` — `AtlasServicesProvider` / `useAtlasServices` exposing
  a per-session `AssetRegistry`, ingestion `Pipeline`, and extractor.
- `app/stores/useIngestion.ts` — `useIngestion` hook wiring the orchestrator to
  the sandbox store and to the pipeline's lifecycle events (per-stage logs +
  status).
- `app/components/sandbox/`: `ImageUploader`, `OriginalImagePanel`,
  `RegistryPanel`, `PipelineStatusPanel`; updated `SandboxLayout`, `DevToolbar`
  (reset also clears the registry), `LogsPanel` (structured entries), and the
  `/sandbox` route (wrapped in `AtlasServicesProvider`).

### Tests added

- `@atlas/shared` `__tests__/registry.test.ts` (11) — register/get/remove/clear/
  query/getByType/replace-by-id/fresh-snapshot.
- `@atlas/web` `app/ingestion/__tests__/validate.test.ts` (7) — all rules +
  boundary size.
- `@atlas/web` `app/ingestion/__tests__/stages.test.ts` (3) — stage order,
  context passthrough, no side-effects.
- `@atlas/web` `app/ingestion/__tests__/ingest.test.ts` (7) — successful
  ingestion, lifecycle log sequence, unsupported/empty/corrupted rejection,
  metadata extraction, asset-in-context.
- `@atlas/web` `app/sandbox.test.ts` updated (9) for the new structured log and
  status state.

## Architecture Decisions

### Registry in `@atlas/shared`

The registry is framework-independent, has zero dependencies beyond the asset
types already in shared, and matches ADR-0002's flat dependency graph. Placing
it in the shared barrel means any future package (engines, workers) can resolve
assets from a single canonical store without a new package.

### Validation decoupled from the DOM `File`

`validateImageFile` takes a structural `ImageFileInput` (`{ name, size, type }`)
rather than `File`. The rules are pure and testable with plain objects; the real
browser `File` satisfies the structurally at the call site. This keeps the noisy
boundary (File/Blob/createImageBitmap) confined to the extractor.

### Browser concerns behind an injectable extractor

Metadata extraction (object URL, `Image` decoding, dimension reading) is the
only part of ingestion that touches the DOM. It is isolated behind the
`ImageMetadataExtractor` interface; the orchestrator depends on the interface
and `createBrowserImageExtractor` is supplied at the composition root. Tests
inject fakes that need no DOM, so the entire ingestion workflow is unit-tested
in Node.

### Pipeline integration reuse, not bypass

The orchestrator builds a `PipelineContext`, sets the immutable `ImageAsset`
under `IMAGE_ASSET_CONTEXT_KEY`, and calls `pipeline.execute`. It does not
short-circuit. The ingestion pipeline ships placeholder no-op stages in the
canonical order (`ingest-image` → `normalize-image` → `estimate-depth`) so the
log reflects the eventual real flow; future capabilities replace the no-ops
with real transformations consuming/producing assets via the context.

### Single source of truth + UI mirror

The `AssetRegistry` is the source of truth; the React sandbox store only
_matters_ a derived count/current-asset snapshot via explicit `dispatch` calls
after mutating the registry. This keeps the registry pure while giving the UI a
reactive view. `DevToolbar` reset clears the registry and syncs the count.

### Lifecycle logging

Two logging channels converge in the sandbox `logs`:

1. The orchestrator's `IngestionLogger` records the high-level lifecycle
   (File Selected → Validation Passed → ImageAsset Created → Asset Registered
   → Pipeline Started → Pipeline Completed/Failed).
2. The `useIngestion` hook subscribes to the pipeline's events
   (`pipeline:started/completed`, `stage:started/completed/failed`) to record
   per-step logs.
   Both write structured `LogEntry` objects (`timestamp`, `level`, `message`),
   which the `LogsPanel` renders colour-coded by level.

### Graceful error handling

All ingestion failures are returned as `AtlasResult` ({ ok: false, error }) and
surfaced to the sandbox as `ingestionError`. The `useIngestion.ingest` wrapper
also guards against unexpected throws. Selecting an unsupported/empty/oversized
or corrupt file updates the UI with a message and never crashes the app.

## Future Considerations

- Replace placeholder stages with real transformations (image normalization →
  `ProcessedImageAsset`, depth estimation → `DepthAsset`).
- Persist registry / enable a storage provider (currently intentionally absent).
- Revoke preview object URLs on reset/re-ingest (lifecycle managed by the
  extractor; a future cleanup pass can revoke on replace).
- Multi-file selection / batch ingestion.
- Per-asset preview lifecycle tracking in the registry metadata.

## Verification

- `pnpm lint` — pass
- `pnpm typecheck` — pass
- `pnpm build` — pass
- `pnpm test` — 94 tests pass across `@atlas/shared` (36), `@atlas/pipeline`
  (29), and `@atlas/web` (29)

Current status: **Completed**
