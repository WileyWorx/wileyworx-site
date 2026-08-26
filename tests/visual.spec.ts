import { expect, test } from "@playwright/test";
import { gotoReady } from "./audit";
import { routes, viewports } from "./routes";

for (const route of routes) {
  for (const viewport of viewports) {
    test(`visual ${route.name} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoReady(page, route.path);
      await expect(page).toHaveScreenshot(`${route.name}-${viewport.name}.png`, {
        fullPage: true,
        animations: "disabled",
        caret: "hide",
        mask: [page.locator(".player")],
      });
    });
  }
}
