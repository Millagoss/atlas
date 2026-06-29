# @atlas/config

**Purpose**: Platform-wide configuration constants and environment validation.

**Responsibilities**:
- Environment detection (development, staging, production)
- Platform URL resolution
- Centralized config access via `loadConfig()`

**Public API**:

```ts
import { loadConfig, AtlasPlatformConfig } from "@atlas/config";
```
