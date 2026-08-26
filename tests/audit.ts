import { expect, type Page } from "@playwright/test";

const TAP_MIN = 44;

type LayoutAudit = {
  overflowX: number;
  overflowing: string[];
  clippedText: string[];
  smallTargets: string[];
};

export async function ready(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) => {
        if (img.complete) return Promise.resolve();
        return Promise.race([
          new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
          new Promise<void>((resolve) => setTimeout(resolve, 4000)),
        ]);
      }),
    );
  });
}

export async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "load" });
  await ready(page);
}

function collectAudit(tapMin: number | null): LayoutAudit {
  const overflowing: string[] = [];
  const clippedText: string[] = [];
  const smallTargets: string[] = [];
  const viewportWidth = window.innerWidth;
  const label = (el: Element) => {
    const name = (el.getAttribute("aria-label") || el.textContent || el.tagName)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);
    return `${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).trim().split(/\s+/).slice(0, 2).join(".") : ""}:${name}`;
  };

  document.querySelectorAll("body *").forEach((el) => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 && rect.height < 1) return;
    if (rect.right > viewportWidth + 1) overflowing.push(label(el));

    const overflowHidden =
      style.overflow === "hidden" || style.overflowY === "hidden" || style.overflowX === "hidden";
    const isMedia =
      el.matches("img, video, canvas, svg, iframe, .card-media, .player, .portrait") ||
      !!el.closest(".card-media, .player");
    if (overflowHidden && !isMedia && el.scrollHeight > el.clientHeight + 1) {
      const hasText = [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      if (hasText || el.matches("p, h1, h2, h3, h4, a, button, label, span, li")) {
        clippedText.push(label(el));
      }
    }
  });

  if (tapMin) {
    document.querySelectorAll("a, button, input, select, textarea, [role='button']").forEach((el) => {
      const input = el as HTMLInputElement;
      if (input.hidden || input.type === "hidden") return;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 && rect.height < 1) return;
      if (rect.width + 0.5 < tapMin || rect.height + 0.5 < tapMin) {
        smallTargets.push(`${label(el)} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
    });
  }

  return {
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    overflowing: overflowing.slice(0, 12),
    clippedText: clippedText.slice(0, 12),
    smallTargets: smallTargets.slice(0, 20),
  };
}

export async function assertLayout(page: Page, options: { tap?: boolean } = {}) {
  const audit = await page.evaluate(collectAudit, options.tap ? TAP_MIN : null);

  expect(audit.overflowX, "horizontal overflow (scrollWidth > innerWidth)").toBeLessThanOrEqual(0);
  expect(audit.overflowing, "elements extending past the right edge").toEqual([]);
  expect(audit.clippedText, "text clipped by overflow:hidden").toEqual([]);
  if (options.tap) {
    expect(audit.smallTargets, "interactive targets smaller than 44x44").toEqual([]);
  }
}
