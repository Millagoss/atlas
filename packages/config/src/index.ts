// @atlas/config — Platform-wide configuration constants and environment validation.

export interface AtlasPlatformConfig {
  /** Base URL for the web application. */
  webUrl: string;
  /** Environment: development | staging | production. */
  env: "development" | "staging" | "production";
}

export function loadConfig(): AtlasPlatformConfig {
  const env = process.env["NODE_ENV"];
  return {
    webUrl: process.env["WEB_URL"] ?? "http://localhost:3000",
    env: env === "staging" || env === "production" ? env : "development",
  };
}
