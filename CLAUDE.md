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

| `lab-m-cmp` | Lab Descriptions → ### Male Panel → #### CMP |
| `lab-m-cbc` | Lab Descriptions → ### Male Panel → #### CBC |
| `lab-m-ua` | Lab Descriptions → ### Male Panel → #### Urinalysis |
| `lab-m-nmr` | Lab Descriptions → ### Male Panel → #### NMR LipoProfile |
| `lab-m-apob` | Lab Descriptions → ### Male Panel → #### Apolipoprotein B |
| `lab-m-lpa` | Lab Descriptions → ### Male Panel → #### Lipoprotein(a) |
| `lab-m-a1c` | Lab Descriptions → ### Male Panel → #### Hemoglobin A1c |
| `lab-m-insulin` | Lab Descriptions → ### Male Panel → #### Insulin, Fasting |
| `lab-m-crp` | Lab Descriptions → ### Male Panel → #### hs-CRP |
| `lab-m-iron` | Lab Descriptions → ### Male Panel → #### Iron and TIBC |
| `lab-m-ferritin` | Lab Descriptions → ### Male Panel → #### Ferritin |
| `lab-m-phosphorus` | Lab Descriptions → ### Male Panel → #### Phosphorus |
| `lab-m-homocys` | Lab Descriptions → ### Male Panel → #### Homocysteine |
| `lab-m-tsh-t4` | Lab Descriptions → ### Male Panel → #### TSH and Free T4 |
| `lab-m-freet3` | Lab Descriptions → ### Male Panel → #### Free T3 |
| `lab-m-tpo` | Lab Descriptions → ### Male Panel → #### TPO Antibody |
| `lab-m-tsi` | Lab Descriptions → ### Male Panel → #### TSI |
| `lab-m-testosterone` | Lab Descriptions → ### Male Panel → #### Testosterone |
| `lab-m-fsh` | Lab Descriptions → ### Male Panel → #### FSH |
| `lab-m-vitd` | Lab Descriptions → ### Male Panel → #### Vitamin D |
| `lab-m-b12` | Lab Descriptions → ### Male Panel → #### B12 and Folate |
| `lab-m-mag` | Lab Descriptions → ### Male Panel → #### Magnesium, RBC |
| `lab-m-omega` | Lab Descriptions → ### Male Panel → #### OmegaCheck |
| `lab-m-ggt` | Lab Descriptions → ### Male Panel → #### GGT |
| `lab-f-fsh` | Lab Descriptions → ### Female Panel → #### FSH |
| `lab-f-lh` | Lab Descriptions → ### Female Panel → #### LH |
| `lab-f-estradiol` | Lab Descriptions → ### Female Panel → #### Estradiol |
| `lab-f-amh` | Lab Descriptions → ### Female Panel → #### AMH |
| `lab-f-testosterone` | Lab Descriptions → ### Female Panel → #### Testosterone |
| `lab-f-shbg` | Lab Descriptions → ### Female Panel → #### SHBG |
| `lab-f-dhea` | Lab Descriptions → ### Female Panel → #### DHEA-Sulfate |
| `lab-f-prolactin` | Lab Descriptions → ### Female Panel → #### Prolactin |
| `lab-f-insulin` | Lab Descriptions → ### Female Panel → #### Insulin, Fasting |
| `lab-f-a1c` | Lab Descriptions → ### Female Panel → #### Hemoglobin A1c |
| `lab-f-tsh-t4` | Lab Descriptions → ### Female Panel → #### TSH and Free T4 |
| `lab-f-freet3` | Lab Descriptions → ### Female Panel → #### Free T3 |
| `lab-f-tpo` | Lab Descriptions → ### Female Panel → #### TPO Antibody |
| `lab-f-tsi` | Lab Descriptions → ### Female Panel → #### TSI |
| `lab-f-tgab` | Lab Descriptions → ### Female Panel → #### Thyroglobulin Antibody |
| `lab-f-17oh` | Lab Descriptions → ### Female Panel → #### 17-OH Progesterone |
| `lab-f-prog` | Lab Descriptions → ### Female Panel → #### Progesterone |
| `lab-f-cmp` | Lab Descriptions → ### Female Panel → #### CMP |
| `lab-f-cbc` | Lab Descriptions → ### Female Panel → #### CBC |
| `lab-f-ua` | Lab Descriptions → ### Female Panel → #### Urinalysis |
| `lab-f-nmr` | Lab Descriptions → ### Female Panel → #### NMR LipoProfile |
| `lab-f-apob` | Lab Descriptions → ### Female Panel → #### Apolipoprotein B |
| `lab-f-lpa` | Lab Descriptions → ### Female Panel → #### Lipoprotein(a) |
| `lab-f-crp` | Lab Descriptions → ### Female Panel → #### hs-CRP |
| `lab-f-iron` | Lab Descriptions → ### Female Panel → #### Iron and TIBC |
| `lab-f-ferritin` | Lab Descriptions → ### Female Panel → #### Ferritin |
| `lab-f-phosphorus` | Lab Descriptions → ### Female Panel → #### Phosphorus |
| `lab-f-homocys` | Lab Descriptions → ### Female Panel → #### Homocysteine |
| `lab-f-vitd` | Lab Descriptions → ### Female Panel → #### Vitamin D |
| `lab-f-b12` | Lab Descriptions → ### Female Panel → #### B12 and Folate |
| `lab-f-mag` | Lab Descriptions → ### Female Panel → #### Magnesium, RBC |
| `lab-f-omega` | Lab Descriptions → ### Female Panel → #### OmegaCheck |
| `lab-f-ggt` | Lab Descriptions → ### Female Panel → #### GGT |

## Notes

- The `[link: ...]` and `[meta]` lines in Obsidian are not rendered as copy — they're metadata only.
- Lab table structure (row numbers, lab names, LabCorp codes, frequency badges, ICD-10 codes) is NOT synced — only the "Why it matters" description text inside each `<td>` is synced via the `lab-m-*` and `lab-f-*` keys above.
- The Lab Interpreter section is not synced — it's code-driven.
- Do not reformat or restructure HTML outside the SYNC anchor pairs.
- For `lab-*` keys: the SYNC anchor is inline inside the `<td>`, e.g. `<td><!-- SYNC:lab-m-cmp -->text<!-- /SYNC:lab-m-cmp --></td>`. Replace only the text between the anchors.
