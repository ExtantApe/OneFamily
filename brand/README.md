# Brand

OneFamily follows the OneOrigin brand. `brand/oneorigin/` is a locked copy of the suite's brand source, OnePhylogeny's [`docs/oneorigin/`](https://github.com/ExtantApe/OnePhylogeny/tree/main/docs/oneorigin). Change the brand there, never in this copy: `node scripts/oneorigin.mjs check` runs in CI and fails on any hand edit. To take a newer source, run `node scripts/oneorigin.mjs lock --source <OnePhylogeny checkout> --copy`.

- **Rename (D174, 2026-11-14):** this app was OneLineage and is now OneFamily. The source now holds OneFamily's own spiral mark as `marks/onefamily-light.svg`, `-dark.svg` and `-small.svg`, in the three-color scheme. The old `onelineage-*` marks in the copy belong to the separate tree-of-life tool and aren't used here.
- **One source (K137, 2026-11-25):** the app reads its mark straight from `brand/oneorigin/marks/` (the `@brand` alias in `apps/desktop/aliases.ts`), so there is no second copy to drift. The toolbar shows the small mark in light appearance and the dark mark in dark appearance.
- **The one** is deep teal `#1f6f6b` with a cream center, and lines are aubergine `#363051` (approved by the owner on 2026-11-12, in `brand/oneorigin/brand.md` and `tokens.json`).
- **Not decided yet:** OneFamily's app icon, tile and maker's mark. No icon masters (`icon.svg`, `icon-small.svg`, `icon-1024.png`) are added until they are.

CSS variables use the prefix `--of-`.
