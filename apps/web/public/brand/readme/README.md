## README Assets

This directory is the canonical home for images embedded in the root repository
`README.md` or other public-facing markdown files.

Use this directory for:

- GitHub README hero images
- repository diagrams or architecture explainer graphics
- static branding images referenced from public docs

Do not use this directory for:

- runtime UI images that belong to the web app experience
- editable source files from design tools
- private review assets or drafts

Recommended conventions:

- prefer stable filenames once linked from markdown
- use SVG for diagrams where possible
- use optimized PNG for hero artwork and screenshots
- keep widths large enough for retina GitHub rendering without shipping oversized files

Example markdown usage from the repository root:

```md
![OneRhythm hero](apps/web/public/brand/readme/repo-hero-1600x900.png)
```
