# OneRhythm — 1R brand assets

Generated from the master 1R artwork. **`svg/1r-mark.svg` is the source of truth** —
every raster here is derived from it. Regenerate rasters rather than editing PNGs.

Brand reference: `docs/brand/OneRhythm_Brand_Guidelines_v3.md`
Accent colour: **Pulse Red `#E20A17`** (4.90:1 on white — passes WCAG AA for text).

---

## Files

### `svg/` — vector sources
| File | Use |
|---|---|
| `1r-mark.svg` | **Primary.** Black letterforms, Pulse Red heart. Light backgrounds. |
| `1r-mark-reversed.svg` | White letterforms, Pulse Red heart, transparent bg. Dark backgrounds. |
| `1r-mark-on-black.svg` | Same, with a solid black background baked in. |
| `1r-mark-mono-black.svg` | Single colour (all black). Embroidery, stamps, fax, one-colour print. |
| `1r-mark-mono-white.svg` | Single colour (all white). One-colour on dark. |

### `png/` — transparent raster marks (natural 546×386 aspect)
`1r-mark-{64,128,256,512,1024,2048}.png` · `1r-mark-reversed-{512,1024}.png` ·
`1r-mark-mono-black-{512,1024}.png` · `1r-mark-mono-white-{512,1024}.png`

### `icons/` — favicons and app icons
| File | Size | Use |
|---|---|---|
| `favicon.ico` | 16/32/48 multi | Legacy browser favicon |
| `favicon-16x16.png` `favicon-32x32.png` `favicon-48x48.png` | — | Modern favicons |
| `favicon.png` | 48 | Expo web favicon |
| `apple-touch-icon.png` | 180 | iOS home screen |
| `android-chrome-192x192.png` `android-chrome-512x512.png` | — | Android / PWA |
| `maskable-512.png` | 512 | Android maskable (mark inside the 66% safe zone) |
| `icon-1024.png` | 1024 | Expo `icon` (iOS app icon) |
| `adaptive-icon-foreground-1024.png` | 1024 | Expo `android.adaptiveIcon.foregroundImage` (transparent) |
| `splash-icon-1024.png` | 1024 | Expo splash |

### `social/` — Open Graph / Twitter
| File | Size | Use |
|---|---|---|
| `og-image-1200x630.png` | 1200×630 | Default OG image |
| `og-image-dark-1200x630.png` | 1200×630 | Dark variant |
| `og-square-1200x1200.png` | 1200×1200 | Square-preferring platforms |
| `twitter-card-1200x600.png` | 1200×600 | `summary_large_image` |

> **Social images are mark-only by design.** They were generated without the
> "OneRhythm" wordmark because Atkinson Hyperlegible was not available at
> generation time, and Brand v3 forbids setting the wordmark in any other
> typeface. The OG *title* tag carries the name in social previews. To add the
> wordmark, run `scripts/regenerate-social.py` once Atkinson Hyperlegible is
> vendored into the repo.

---

## HTML head — copy/paste

```html
<!-- Favicons -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#FFFFFF">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="OneRhythm">
<meta property="og:title" content="OneRhythm — you are not alone with your heart">
<meta property="og:description" content="A peer-support community for people living with cardiac arrhythmia, and the people who care for them.">
<meta property="og:url" content="https://onerhythm.org/">
<meta property="og:image" content="https://onerhythm.org/social/og-image-1200x630.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The OneRhythm 1R mark: a numeral one and the letter R, with a red heart inside the R.">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="OneRhythm — you are not alone with your heart">
<meta name="twitter:description" content="A peer-support community for people living with cardiac arrhythmia, and the people who care for them.">
<meta name="twitter:image" content="https://onerhythm.org/social/twitter-card-1200x600.png">
```

**Absolute URLs are required** for `og:image` — relative paths are ignored by most
scrapers. Update the domain if it differs from `onerhythm.org`.

## Expo — `app.json` / `app.config.js`

```json
{
  "expo": {
    "icon": "./assets/brand/icons/icon-1024.png",
    "splash": {
      "image": "./assets/brand/icons/splash-icon-1024.png",
      "resizeMode": "contain",
      "backgroundColor": "#FFFFFF"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/brand/icons/adaptive-icon-foreground-1024.png",
        "backgroundColor": "#FFFFFF"
      }
    },
    "web": { "favicon": "./assets/brand/icons/favicon.png" }
  }
}
```

## Alt text (accessibility — always required)

Default: **"OneRhythm"** where the mark acts as the site/app name.
Descriptive (about pages, press): **"The OneRhythm 1R mark: a numeral one and the
letter R, with a red heart inside the R."**
Decorative repeats: `alt=""` + `aria-hidden="true"`.

## Misuse (Brand v3 §2)

Never rotate, stretch, outline, add glow/shadow/bevel, recolour the heart to
anything but Pulse Red (or a knockout), place the mark on a busy photo, or reset
the wordmark in another typeface. Clear space on all sides = the width of the
numeral 1.
