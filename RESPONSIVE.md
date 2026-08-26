# Responsive

Desktop and mobile are equal. Neither is a fallback, an enhancement, or a degraded version of the other. Both are first-class layouts for different users in different contexts.

What is “narrow-first” here is a CSS authoring technique, not a priority order. Unqualified styles apply everywhere, so the base file is written for the narrowest viewport. `min-width` queries then add wider structure. That produces fewer override rules. Desktop-first authoring requires every narrow rule to undo a wide rule, and those undo-rules are what silently break when new content is added.

Fluid primitives (`clamp()`, intrinsic grid and flex, container queries, `dvh`) serve both experiences. They eliminate accidental breakpoints. They do not forbid intentional ones. When the ideal wide structure genuinely differs from the ideal narrow structure, change it on purpose at a chosen `--bp-*` width.

## Quality, not merely unbroken

At every width the question is “is this good here?”, not “does this fail to break?”

- Narrow: tap targets, thumb-reachable primary actions, content order for a small screen.
- Wide: real use of horizontal space, multi-column structure where it aids comprehension, density suited to a large screen with a pointer. Do not stretch a narrow layout to 1440px.
- 768px and 1024px are first-class, not a leftover between two poles. Check them explicitly.

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
- `max-width` media queries (those exist to undo a wide layout)
- `vh` units
- Fixed `width` / `flex-basis` on layout containers

**Lint (warns)**
- A breakpoint that is not `--bp-sm` (40rem), `--bp-md` (60rem), or `--bp-lg` (80rem)
- A selector with more than two breakpoint overrides

`@media` and `@container` cannot read custom properties. Repeat the token value and keep it in sync (`60rem` is `--bp-md`).

**Components**
- Correct at 320px: no horizontal scroll, 44px taps, order that belongs on a phone
- Correct at 768px and 1024px: tablet and mid-size are designed, not inferred
- Correct at 1440px: horizontal space used on purpose
- Work in a container of any width; never assume the viewport
- Survive names and titles at twice the expected length (`overflow-wrap`, `min-width: 0`)
- No outer margin; the parent owns spacing (`gap` on the parent)

**Verify**
```bash
npm run check:responsive
```
Runs lint, then Playwright layout, axe, device, and screenshot checks at 320, 375, 390, 414, 768, 1024, 1280, and 1440. After an intentional visual change: `npm run check:responsive:update`, review `tests/baselines/`, commit. Passing overflow and tap tests is necessary, not sufficient.
