import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { gotoReady } from "./audit";
import { routes, viewports } from "./routes";

for (const route of routes) {
  for (const viewport of viewports) {
    test(`axe ${route.name} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoReady(page, route.path);
      const results = await new AxeBuilder({ page }).exclude(".player").analyze();
      expect(results.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => node.target),
      }))).toEqual([]);
    });
  }
}
