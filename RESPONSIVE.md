# Responsive

Tokens live in `src/styles/tokens.css`. Use them. Do not invent sizes in components.

**Reach for**
- Type: `font-size: var(--text-md)` (scale `--text-xs` through `--text-display`)
- Space: `var(--space-xs)` through `var(--space-3xl)`
- Page width: `width: min(100% - 2 * var(--space-lg), var(--max))`
- Grids: `repeat(auto-fit, minmax(var(--card-min), 1fr))`
- Stacking rows: `flex-wrap` plus `flex: 1 1 var(--col-min)`
- Height: `100dvh` or `100svh`, never `vh`

**Lint (fails the build)**
- Pixel font sizes outside the token file
- `max-width` media queries
- `vh` units
- Fixed `width` / `flex-basis` on layout containers

**Lint (warns)**
- A breakpoint that is not `--bp-sm` (40rem), `--bp-md` (60rem), or `--bp-lg` (80rem)
- A selector with more than two breakpoint overrides

`@media` and `@container` cannot read custom properties. Repeat the token value and keep it in sync (`60rem` is `--bp-md`).

**Components**
- Work at 320px with no horizontal scroll
- Work in a container of any width; never assume the viewport
- Survive names and titles at twice the expected length (`overflow-wrap`, `min-width: 0`)
- No outer margin; the parent owns spacing (`gap` on the parent)

**Verify**
```bash
npm run check:responsive
```
Runs lint, then Playwright layout, axe, device, and screenshot checks. After an intentional visual change: `npm run check:responsive:update`, review `tests/baselines/`, commit.
