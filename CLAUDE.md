# PocketDoc — Claude Instructions

## Sync command

When Nick says **"sync my health website"** or **"sync the site"**:

1. Read the Obsidian master note:
   `/Users/nicolascapra/Library/Mobile Documents/iCloud~md~obsidian/Documents/iCloud Vault/🏥 Health/Resources/Nicks Health Resource Website.md`

2. Read `index.html`

3. For each SYNC anchor pair in index.html (format: `<!-- SYNC:key -->...<!-- /SYNC:key -->`), find the corresponding section in the Obsidian note and compare the text content.

4. Update only the sections where the content has changed. Replace the content between the anchor comments — preserve the anchor comments themselves and all surrounding HTML.

5. When a product's `[link: ...]` line in Obsidian has a real URL (not "placeholder"), also update the `href` on the wrapping `<a>` tag for that product card.

6. `git add index.html`, commit with a message listing what changed, `git push`.

7. Report back: which sections were updated, what changed.

## SYNC key map

| SYNC key | Obsidian section |
|---|---|
| `hero-eyebrow` | Hero → Eyebrow line |
| `hero-h1` | Hero → H1 line |
| `hero-sub` | Hero → Sub line |
| `start-here` | Start Here (full body, rendered as `<p>` tags) |
| `labs-intro` | Labs intro paragraph |
| `supplements-intro` | Supplements intro paragraph |
| `supp-multivitamin` | Supplements → ### Multivitamin |
| `supp-probiotic` | Supplements → ### Probiotic |
| `supp-organ-meat` | Supplements → ### Organ Meat / Beef Liver |
| `supp-magnesium` | Supplements → ### Magnesium |
| `fullscript-banner` | Supplements → ### Fullscript Banner |
| `prod-cloud-ro` | Product Recs → ### Cloud Reverse Osmosis System |
| `prod-branch-basics` | Product Recs → ### Branch Basics |
| `prod-blueland` | Product Recs → ### Blueland |
| `prod-mollys-suds` | Product Recs → ### Molly's Suds |
| `prod-blueland-dish` | Product Recs → ### Blueland Dishwasher Tabs |
| `buy-fullscript` | Where to Buy → ### Fullscript |
| `buy-amazon` | Where to Buy → ### Amazon |
| `buy-truemed` | Where to Buy → ### TrueMed / HSA |

## Notes

- The `[link: ...]` and `[meta]` lines in Obsidian are not rendered as copy — they're metadata only.
- Lab table rows (ICD-10 codes, "why it matters") are not synced — edit those directly in index.html.
- The Lab Interpreter section is not synced — it's code-driven.
- Do not reformat or restructure HTML outside the SYNC anchor pairs.
