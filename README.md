# Atlas

Spatial computing platform monorepo.

## Packages

| Package                | Description                               |
| ---------------------- | ----------------------------------------- |
| `@atlas/web`           | TanStack Start web application            |
| `@atlas/ai-engine`     | AI inference and pipeline orchestration   |
| `@atlas/scene-engine`  | 3D scene graph and spatial queries        |
| `@atlas/viewer-engine` | 3D rendering and viewport management      |
| `@atlas/ui`            | Shared React component library            |
| `@atlas/shared`        | Shared types, utilities, and constants    |
| `@atlas/config`        | Platform configuration and env validation |

## Setup

```bash
pnpm install
pnpm run dev        # Start web app at http://localhost:3000
```

## Commands

| Command                 | Description                    |
| ----------------------- | ------------------------------ |
| `pnpm run dev`          | Start development servers      |
| `pnpm run build`        | Build all packages             |
| `pnpm run lint`         | Lint all packages              |
| `pnpm run typecheck`    | Type-check all packages        |
| `pnpm run test`         | Run unit tests                 |
| `pnpm run test:e2e`     | Run Playwright E2E tests       |
| `pnpm run format`       | Format all files with Prettier |
| `pnpm run format:check` | Check formatting               |

## Architecture

- **Framework**: TanStack Start + React 19
- **Language**: TypeScript strict mode
- **Build**: Turborepo with pnpm workspaces
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Testing**: Vitest + Playwright
- **Linting**: ESLint + Prettier

See [docs/adr/](docs/adr/) for architecture decisions.

## License

MIT
