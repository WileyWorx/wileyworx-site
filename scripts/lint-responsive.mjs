#!/usr/bin/env node
/**
 * Responsive constraints for WileyWorx.
 * Tokens live in src/styles/tokens.css. This script fails on the anti-patterns
 * that reintroduce desktop-first or non-fluid CSS.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const TOKEN_REL = "src/styles/tokens.css";
const TOKEN_PATH = join(ROOT, TOKEN_REL);

const errors = [];
const warnings = [];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === "baselines") continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else if (/\.(css|astro)$/.test(name)) acc.push(full);
  }
  return acc;
}

function rel(file) {
  return relative(ROOT, file);
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/<!--[\s\S]*?-->/g, " ");
}

function lineAt(source, index) {
  return source.slice(0, index).split("\n").length;
}

function add(list, file, line, message) {
  list.push(`${rel(file)}:${line}  ${message}`);
}

function extractCss(source, file) {
  if (file.endsWith(".css")) return source;
  const blocks = [];
  const styleTag = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleTag.exec(source))) blocks.push(match[1]);
  const inline = /style\s*=\s*(["'])([\s\S]*?)\1/gi;
  while ((match = inline.exec(source))) blocks.push(match[2]);
  return blocks.join("\n");
}

function parseTokens(css) {
  const tokens = {};
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match;
  while ((match = re.exec(css))) tokens[match[1]] = match[2].trim();
  return tokens;
}

function lengthToPx(value) {
  const match = value.trim().match(/^([\d.]+)(px|rem|em)$/i);
  if (!match) return null;
  const n = Number(match[1]);
  return match[2].toLowerCase() === "px" ? n : n * 16;
}

const tokenSource = readFileSync(TOKEN_PATH, "utf8");
const tokens = parseTokens(stripComments(tokenSource));
const breakpoints = Object.entries(tokens)
  .filter(([name]) => name.startsWith("--bp-"))
  .map(([name, value]) => ({ name, value, px: lengthToPx(value) }))
  .filter((item) => item.px != null);

function isTokenFile(file) {
  return rel(file) === TOKEN_REL;
}

function matchQueryBlocks(css) {
  const blocks = [];
  const startRe = /@(media|container)[^{]*\{/gi;
  let match;
  while ((match = startRe.exec(css))) {
    const kind = match[1].toLowerCase();
    const header = match[0].slice(0, -1).trim();
    const bodyStart = match.index + match[0].length;
    let depth = 1;
    let i = bodyStart;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth += 1;
      else if (css[i] === "}") depth -= 1;
      i += 1;
    }
    blocks.push({
      kind,
      header,
      body: css.slice(bodyStart, i - 1),
      index: match.index,
    });
  }
  return blocks;
}

function selectorsIn(body) {
  const selectors = [];
  const re = /([^{}]+)\{/g;
  let match;
  while ((match = re.exec(body))) {
    const selector = match[1].replace(/@[\s\S]+$/, "").trim();
    if (selector && !selector.startsWith("@")) selectors.push(selector);
  }
  return selectors;
}

const files = walk(SRC);

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const css = stripComments(extractCss(source, file));
  if (!css.trim()) continue;
  const tokenFile = isTokenFile(file);

  if (!tokenFile) {
    const fontPx = /font-size\s*:\s*[^;]*\d+px/gi;
    let match;
    while ((match = fontPx.exec(css))) {
      add(errors, file, lineAt(css, match.index), `pixel font-size is not allowed outside ${TOKEN_REL}`);
    }
  }

  const maxMedia = /@media[^{]*max-width/gi;
  let match;
  while ((match = maxMedia.exec(css))) {
    add(errors, file, lineAt(css, match.index), "max-width media queries are not allowed (mobile-first min-width only)");
  }

  const vh = /(?<![dsl])vh\b/gi;
  while ((match = vh.exec(css))) {
    add(errors, file, lineAt(css, match.index), "vh is not allowed; use dvh or svh");
  }

  if (!tokenFile) {
    const widthProps = /(?:^|[\s;{])((?:min-|max-)?width|flex-basis)\s*:\s*([^;{}]+)/gi;
    while ((match = widthProps.exec(css))) {
      const prop = match[1];
      const value = match[2].trim();
      const around = css.slice(Math.max(0, match.index - 80), match.index).toLowerCase();
      const onMedia = /(?:img|svg|video|canvas|iframe)\s*$/.test(around) || around.includes("img {") || around.includes(".brand img");
      if (onMedia) continue;
      if (/^(0|0px|auto|none|100%|min-content|max-content|fit-content)$/i.test(value)) continue;
      if (value.includes("var(") || value.includes("min(") || value.includes("max(") || value.includes("clamp(") || value.includes("calc(")) continue;
      if (/^[\d.]+(px|rem|em|vw|vh|dvh|svh)$/i.test(value)) {
        add(
          errors,
          file,
          lineAt(css, match.index),
          `fixed ${prop}: ${value} on a layout container; use a token, min(), or 100%`,
        );
      }
    }

    const flexBasis = /flex\s*:\s*[^;]*\s([\d.]+(?:px|rem|em))\s*(?:;|$)/gi;
    while ((match = flexBasis.exec(css))) {
      add(
        errors,
        file,
        lineAt(css, match.index),
        `fixed flex-basis ${match[1]}; use var(--col-min) or another layout token`,
      );
    }
  }

  const queryBlocks = matchQueryBlocks(css);
  const selectorHits = new Map();
  for (const block of queryBlocks) {
    const widths = [...block.header.matchAll(/(?:min|max)-width\s*:\s*([\d.]+)(px|rem|em)/gi)];
    for (const width of widths) {
      const px = lengthToPx(`${width[1]}${width[2]}`);
      const known = breakpoints.some((bp) => Math.abs(bp.px - px) < 0.5);
      if (!known) {
        add(
          warnings,
          file,
          lineAt(css, block.index),
          `breakpoint ${width[1]}${width[2]} is not in the token set (${breakpoints.map((bp) => `${bp.name} ${bp.value}`).join(", ")})`,
        );
      }
    }
    for (const selector of selectorsIn(block.body)) {
      const key = selector.replace(/\s+/g, " ");
      if (!selectorHits.has(key)) selectorHits.set(key, 0);
      selectorHits.set(key, selectorHits.get(key) + 1);
    }
  }
  for (const [selector, count] of selectorHits) {
    if (count > 2) {
      add(
        warnings,
        file,
        1,
        `${selector} has ${count} breakpoint overrides (limit 2)`,
      );
    }
  }
}

if (breakpoints.length === 0) {
  errors.push(`${TOKEN_REL}  no --bp-* tokens found`);
}

for (const item of errors) console.error(`error  ${item}`);
for (const item of warnings) console.warn(`warning  ${item}`);

const summary = `${errors.length} error(s), ${warnings.length} warning(s)`;
if (errors.length) {
  console.error(`\nresponsive lint failed: ${summary}`);
  process.exit(1);
}
console.log(`responsive lint passed: ${summary}`);
