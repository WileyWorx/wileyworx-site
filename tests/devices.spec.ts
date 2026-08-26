import { devices, test } from "@playwright/test";
import { assertLayout, gotoReady } from "./audit";
import { phoneDevices, routes } from "./routes";

for (const deviceName of phoneDevices) {
  const descriptor = devices[deviceName];
  if (!descriptor?.viewport) continue;

  for (const route of routes) {
    test(`${deviceName} portrait ${route.name}`, async ({ browser }) => {
      const context = await browser.newContext({ ...descriptor });
      const page = await context.newPage();
      await gotoReady(page, route.path);
      await assertLayout(page, { tap: true });
      await context.close();
    });

    test(`${deviceName} landscape ${route.name}`, async ({ browser }) => {
      const { width, height } = descriptor.viewport;
      const context = await browser.newContext({
        ...descriptor,
        viewport: { width: height, height: width },
      });
      const page = await context.newPage();
      await gotoReady(page, route.path);
      await assertLayout(page, { tap: true });
      await context.close();
    });
  }
}
