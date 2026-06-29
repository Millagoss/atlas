# @atlas/config

Platform-wide configuration constants and environment validation.

## Responsibilities

- Environment detection (development, staging, production)
- Platform URL resolution
- Centralized config via `loadConfig()`

## Public API

- `loadConfig`
- `AtlasPlatformConfig`

## Dependencies

- `@types/node` (dev, for `process.env` types)
