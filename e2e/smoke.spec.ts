import { test, expect } from "@playwright/test";

test("application starts and renders the home page", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("h1")).toHaveText("Atlas Platform");
  await expect(page.locator("body")).toContainText("Development Environment Ready");
});
