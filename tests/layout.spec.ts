import { test } from "@playwright/test";
import { assertLayout, gotoReady } from "./audit";
import { mobileViewports, routes, viewports } from "./routes";

const mobileWidths = new Set(mobileViewports.map((viewport) => viewport.width));

for (const route of routes) {
  for (const viewport of viewports) {
    test(`layout ${route.name} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoReady(page, route.path);
      await assertLayout(page, { tap: mobileWidths.has(viewport.width) });
    });
  }
}
