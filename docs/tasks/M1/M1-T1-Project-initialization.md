IMPLEMENTATION PROMPT — M1.T1 Repository Foundation

You are a Senior Full-Stack Engineer responsible for implementing Milestone 1 – Pack 1.1 of the Atlas Spatial Computing Platform.

Your task is to build only the project foundation.

Do not implement any business features, AI, viewer functionality, authentication, uploads, database integrations, or marketplace features.

Objective

Create a production-ready monorepo using the following stack:

TanStack Start
React 19
TypeScript
pnpm Workspaces
Turborepo
Tailwind CSS
shadcn/ui (install only; no UI implementation)
ESLint
Prettier
Husky
lint-staged
Vitest
Playwright
Repository Structure

Create the following structure:

apps/
web/

packages/
ai-engine/
scene-engine/
viewer-engine/
shared/
ui/
config/

workers/

docs/

tooling/

Each package should have a minimal, valid setup with a public entry point. Do not implement business logic—only create the structure and placeholder exports where appropriate.

TypeScript

Configure:

Strict mode
Project references
Path aliases
Incremental builds

Cross-package imports should work using aliases such as:

import {} from "@atlas/shared";
import {} from "@atlas/viewer-engine";

Avoid relative imports between packages.

Tooling

Configure:

ESLint
Prettier
Husky
lint-staged

Pre-commit hooks should run formatting, linting, and type checking.

Testing

Configure:

Vitest
Playwright

Create a single smoke test that verifies the application starts successfully.

Continuous Integration

Create a GitHub Actions workflow that runs:

Install dependencies
Lint
Type check
Build
Tests
UI

Create only a minimal placeholder page displaying something like:

Atlas Platform – Development Environment Ready

Do not spend time on styling.

Out of Scope

Do not implement:

Authentication
Supabase
Cloudflare R2
Image uploads
AI inference
Three.js
React Three Fiber
Database
APIs
Marketplace features
Viewer functionality

If you identify future improvements, document them under a Future Considerations section instead of implementing them.

Deliverables

When finished, provide:

A summary of the project structure.
A list of files created or modified.
Any architectural decisions made.
Any assumptions.
Any blockers or recommendations.

Stop after completing this implementation pack. Do not proceed to additional functionality.
