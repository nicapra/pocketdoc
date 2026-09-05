# PocketDoc — Claude Instructions

## Architecture (as of 2026-09-05 — full redesign via Claude Design)

`index.html` is no longer a plain static page — it's a Claude Design ("DC") canvas export:

- `<script src="./support.js"></script>` loads the DC runtime that interprets the custom `<x-dc>` markup (`sc-if`, `sc-for`, `{{ binding }}` attributes, `onClick="{{ handler }}"`, etc.).
- `_ds/organic-52b62620-07d9-4248-a83f-b5d51e7086fc/` is the "Organic" design-system bundle: `styles.css` (all colors/fonts/spacing as CSS variables — `--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*`) and `_ds_bundle.js`. See that folder's `readme.md` for the full system.
- The actual page logic lives in one `<script type="text/x-dc" data-dc-script">` block near the bottom of `index.html`: a `class Component extends DCLogic` with React-style `state`/`setState`, plus plain consts for data (`SUPPLEMENTS`, `PRODUCTS`, `BUY`, `MALE_ROWS_RAW`, `FEMALE_ROWS_RAW`).
- Nav is a single top bar (Labs / Supplements / Products) with client-side routing (`this.state.route`) and a full-bleed circle-wipe transition animation between pages. Home is an interactive radial hub (concentric rings for Labs/Products/Supplements) instead of the old card grid.
- The Lab Interpreter is no longer a separate top-level page — it's a collapsible "Beta" panel nested inside the Labs page.
- **`api/interpret.js` and `api/explain.js` are unchanged** — the page still calls them at `/api/interpret` and `/api/explain` with `{ fileBase64, mediaType }`.
- `logo.png` is unchanged (same file as before the redesign).

**The old SYNC-anchor system (`<!-- SYNC:key -->...<!-- /SYNC:key -->` HTML comments) no longer exists anywhere in this file.** There is no Obsidian-note sync flow anymore. To change any content, edit the relevant const/array directly in the `<script type="text/x-dc">` block.

## Where content lives now

| What | Where |
|---|---|
| Hero eyebrow ("A personal health resource") + disclaimer | Inline in the `isHome` block, near the top of the `<x-dc>` markup |
| Labs intro paragraph + "read more" expansion text | Inline in the `isLabs` block |
| Lab data (name, Labcorp code, ICD-10, "why it matters" text, frequency badges) | `MALE_ROWS_RAW` / `FEMALE_ROWS_RAW` arrays — built via the `row(num, name, code, icd, desc, freq)` and `day(label)` helpers |
| Supplements (Top Pick, Alternative, Why I chose this, Dosing, Testing, affiliate link) | `SUPPLEMENTS` array — `{ badge, badgeClass, name, topPick, topPickLink?, topPickLinkNote?, alternative?, why, dosing?, testing?, nickNote? }`. Rendered as compact rows on the Supplements page, full detail in the modal (`suppModalOpen` / `selectedSupp`). |
| Products (household items) | `PRODUCTS` array, grouped by `category` |
| Where to Buy (Fullscript/Amazon/TrueMed) | `BUY` array — now lives on the **Supplements** page, not Products |
| Doctor-view intro sentences (male/female) | Inline `<p>` just above each `<table class="table">` in the `maleViewDoctor`/`femaleViewDoctor` blocks |

## Notes

- **Nick's own copy (`why`/`dosing`/`testing`/any personal-voice text) must be pasted in exactly as given — no rephrasing, typo fixes, or "cleanup."** He explicitly does not want any trace of AI polish in his writing. Factual corrections (e.g. a misspelled brand/product name that doesn't actually exist) are fine; touching his phrasing or sentence structure is not.
- When porting future Claude Design exports into this repo: copy `index.html`, `support.js`, `logo.png`, and the whole `_ds/<bundle-id>/` folder to the same relative paths — the bundle folder name changes per export, so remove the old one if a new bundle id replaces it (check the `<link>`/`<script>` paths inside the new `index.html` first). Check the exported `github.md` (if present) for a screen map of what changed. Always diff the new export's content (supplements/labs/products/hero copy) against what's currently live before overwriting — Design exports are sometimes built from a stale content snapshot and can silently drop or alter copy Nick wrote or approved. Go through differences with Nick piece by piece rather than assuming the export is authoritative.
- The old root-level `styles.css` and `script.js` (dead legacy files from the pre-redesign version) have been deleted. Don't recreate them — the live stylesheet is `_ds/organic-.../styles.css`.
