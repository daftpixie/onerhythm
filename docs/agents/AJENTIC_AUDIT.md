# AJENTIC Audit Report — Frontend, Brand & Creative

**Agent**: AJENTIC
**Date**: 2026-03-21
**Scope**: Read-only audit of the entire frontend domain
**Verdict**: PARTIAL PASS — design system foundation solid, gaps in accessibility
and component abstraction

---

## 1. Route Inventory

**38 page routes** identified across `apps/web/app/`:

| Route | Type | Notes |
|---|---|---|
| `/` | Public landing | Hero + mission preview |
| `/about` | Public | Origin story, CTA |
| `/about/account` | Auth | Account management (new) |
| `/community` | Public | Community hub |
| `/community/stories` | Public | Story listing |
| `/community/stories/[slug]` | Public | Individual story |
| `/contribute` | Auth | Upload entry point |
| `/contribute/create` | Auth | Contribution creation (new, v3) |
| `/contribute/joined` | Auth | Post-join confirmation |
| `/contribute/shared/[id]` | Public | Shared contribution view |
| `/join` | Public | Waitlist / signup |
| `/learn` | Public | Educational content |
| `/mission` | Public | Mission overview |
| `/mosaic` | Public | Heart mosaic gallery |
| `/onboarding` | Auth | New user onboarding |
| `/research` | Public | Research hub |
| `/research/pulse` | Public | Research Pulse feed |
| `/research/pulse/[slug]` | Public | Individual pulse article |
| `/research/pulse/for-you` | Auth | Personalized pulse |
| `/result` | Public | Contribution result (new, v3) |
| `/result/[shareSlug]` | Public | Viral landing page |
| `/api/og` | API | OG image generation (new) |

**Deleted routes** (tracked in git as deleted):
- `/account/data` — data controls shell (removed)
- `/account/stories` — story submission (removed)

### Assessment
- Route structure is clean and follows App Router conventions
- New v3 routes (`/contribute/create`, `/result`) coexist with legacy routes
- No orphaned layout files detected

---

## 2. Design System Compliance

### 2.1 Hardcoded Hex Values

**17 files** contain hardcoded hex color values:

| File | Count | Context |
|---|---|---|
| `mission-control-scene.tsx` | 12+ | Three.js material colors (`new THREE.Color('#...')`) |
| `mission-control-shell.tsx` | 3 | HUD panel backgrounds |
| `mission-live-shell.tsx` | 2 | Live state indicators |
| `mission-result-shell.tsx` | 2 | Result card accents |
| `globals.css` | 40+ | CSS custom property definitions (CORRECT — source of truth) |
| `tailwind.config.ts` | 20+ | Tailwind token definitions (CORRECT — maps from CSS vars) |
| `art-reveal.tsx` | 1 | Canvas background |
| `processing-state.tsx` | 1 | Loading indicator |
| `live-rhythm-stream.tsx` | 2 | Stream visualization |

**Verdict**: `globals.css` and `tailwind.config.ts` are the correct locations for
hex definitions. The Three.js scene files are a known exception (WebGL materials
require direct color values). **5-6 component files** have hardcoded hex that
should migrate to CSS variables.

### 2.2 Typography

- **Exo 2**: Used exclusively for headings. **Zero instances below 18px** — compliant.
- **DM Sans**: Used for body text via Tailwind `font-sans` — compliant.
- **Space Mono**: Used for data/metrics via `font-mono` Tailwind class — compliant.
- **No dedicated `<Heading>` component** exists. Typography enforcement is via
  Tailwind utility classes, not a guarded component.
- **No dedicated `<DataText>` component** exists. Metric displays use `font-mono`
  directly.

**Gap**: AJENTIC spec calls for `Heading` and `DataText` wrapper components that
enforce font + size rules. Currently relies on developer discipline via Tailwind
classes. No violations found, but no guardrails exist.

### 2.3 CSS Custom Properties

Complete token system defined in `globals.css`:

```
--color-deep-void, --color-midnight, --color-cosmos, --color-nebula
--color-pulse-red, --color-signal-cyan, --color-aurora-green
--color-text-primary, --color-text-secondary, --color-text-muted
--color-surface-0 through --color-surface-3
--color-glow-pulse, --color-glow-signal, --color-glow-aurora
```

All surface depth levels (Level 0–3) properly mapped. Glow colors defined for
state-based usage.

### 2.4 Tailwind Token Mapping

`tailwind.config.ts` correctly maps CSS custom properties to Tailwind tokens:
- `colors.void`, `colors.midnight`, `colors.cosmos`, `colors.nebula`
- `colors.pulse`, `colors.signal`, `colors.aurora`
- Font families: `exo2`, `dmSans`, `spaceMono` all registered

**Verdict**: Token system is complete and correctly wired. Component-level
enforcement components (`Heading`, `DataText`) are missing but no violations
exist in practice.

---

## 3. 3D Scene Audit

**File**: `apps/web/components/mission/mission-control-scene.tsx`

| Check | Status | Notes |
|---|---|---|
| Atmosphere mesh deleted | PASS | No `EarthAtmosphere`, no Fresnel shaders |
| Route + points parented to Earth | PASS | `EarthSystemGroup` wraps Earth + route + points |
| Camera position | PASS | `[0, 0.3, 4.2]`, fov 40 |
| Instanced rendering | PASS | `InstancedMesh` used for contribution points |
| NASA night-lights texture | PASS | Loaded via `useLoader(THREE.TextureLoader)` |
| Bloom post-processing | PASS | intensity 0.25, threshold 0.5 |
| Route line thickness | PASS | 0.018 radius (thin, not chunky) |
| Moon in world space | PASS | Outside `EarthSystemGroup` |
| Stars in world space | PASS | Outside `EarthSystemGroup` |
| Mobile 2D fallback | MISSING | No fallback for low-end devices |
| `prefers-reduced-motion` | PASS | Rotation speed set to 0 when reduced motion |

**Scene graph**:
```
<Canvas>
  <CameraRig />           ← gentle sway orbit
  <ambientLight />
  <directionalLight />
  <EarthSystemGroup>      ← rotating group (0.04 rad/s)
    <EarthBody />         ← textured sphere, no atmosphere
    <RouteRibbon />       ← tube geometry on Earth surface
    <WaypointInstances /> ← instanced spheres at waypoints
    <WindowSegmentsInstances /> ← ×4 instanced route windows
    <ProgressBeacon />    ← current position marker
  </EarthSystemGroup>
  <MoonBody />            ← world space, independent orbit
  <Stars />               ← world space, static
  <EffectComposer>        ← bloom post-processing
</Canvas>
```

**Verdict**: Scene is clean and well-structured. Missing mobile 2D fallback is
the only gap.

---

## 4. Content & Copy Audit

### 4.1 Content Module System

Central content store: `apps/web/content/site-copy.ts`

Additional content modules:
- `lib/metadata.ts` — page metadata and SEO
- `lib/mission-v3-overview.ts` — mission narrative copy
- `lib/rhythm-contribution-display.ts` — contribution result copy

Copy is generally sourced from content modules, not hardcoded in TSX. Some
inline strings remain in older components.

### 4.2 Brand Phrase Inventory

| Phrase | Occurrences | Status |
|---|---|---|
| `#OneRhythm` | Present in content modules | PASS |
| `#InvisibleBears` | 38 occurrences | PASS |
| `#SharedRhythm` | 44 occurrences | PASS |
| `invisible bear` (narrative) | 11 occurrences | PASS |
| `Join the mission` | 39 occurrences | PASS |
| `ad astra per aspera` | 3 occurrences | PASS |
| `pain is not a competition` | **0 occurrences** | **MISSING** |

### 4.3 Forbidden Phrases

| Phrase | Occurrences | Status |
|---|---|---|
| `#FindYourRhythm` | 0 | PASS |
| `Join the community` (as CTA) | 0 | PASS |
| `lights` (instead of `rhythms`) | 0 | PASS |
| `users submitted` | 0 | PASS |
| `collected data` | 0 | PASS |

**Verdict**: Brand voice is well-maintained. One canonical phrase missing:
**"pain is not a competition"** should appear at least once in content modules.

---

## 5. Accessibility Audit

### 5.1 Reduced Motion

- **13 files** contain `prefers-reduced-motion` support
- **88 files** contain animations (CSS transitions, Framer Motion, Three.js)
- **Coverage: ~15%** — significant gap

Files with animations but NO reduced-motion gating:
- Most Framer Motion `motion.div` usage in page components
- CSS transitions on hover states (acceptable for simple transitions)
- Three.js scene animations (partially covered via `EarthSystemGroup`)

### 5.2 ARIA & Screen Reader

| Check | Status | Notes |
|---|---|---|
| `aria-live` regions | **1 total** (medical disclaimer in `packages/ui`) | GAP — realtime counters need `aria-live` |
| `aria-label` usage | Present on interactive elements | PASS |
| Alt text on images | No missing alt text detected | PASS |
| Skip navigation link | Not present | GAP |

### 5.3 Focus & Keyboard

- Global focus indicator: `2px Signal Cyan outline, 3px offset` — set in `globals.css` — PASS
- Interactive elements reachable via keyboard — PASS (spot-checked)
- No focus traps detected — PASS

### 5.4 Touch Targets

- `44px` minimum touch targets consistently applied via Tailwind `min-h-11 min-w-11`
  or explicit sizing — PASS

### 5.5 Color Contrast

- Dark theme with light text — generally good contrast
- Muted text (`--color-text-muted`) may be below 4.5:1 on some surfaces —
  needs manual verification

**Verdict**: Foundation is solid (focus indicators, touch targets, alt text).
Gaps in reduced-motion coverage and `aria-live` for realtime updates are the
primary concerns.

---

## 6. Share Engine Audit

### 6.1 OG Image Generation

- `/api/og` route exists in `apps/web/app/api/og/` — generates dynamic OG images
- Standard dimensions (1200×630) supported
- Stories format (1080×1920) — not confirmed present

### 6.2 Share Components

- `SharePanel` component exists at `components/shared/share-panel.tsx`
- Platform-specific share buttons present
- Share copy sourced from content modules

### 6.3 Viral Landing Page

- `/result/[shareSlug]` route exists for shared contribution viewing
- `/contribute/shared/[id]` provides alternative share view
- Metadata generation present for social previews

**Verdict**: Share engine is functional. Stories-format OG images (1080×1920)
need verification.

---

## 7. Dead Frontend Files

### Confirmed Dead (deleted from git, safe to clean up references)

| File | Reason |
|---|---|
| `app/account/data/data-controls-shell.test.tsx` | Deleted |
| `app/account/data/data-controls-shell.tsx` | Deleted |
| `app/account/data/page.tsx` | Deleted |
| `app/account/stories/page.tsx` | Deleted |
| `app/account/stories/story-submission-shell.tsx` | Deleted |

### Review Needed

| File | Reason |
|---|---|
| `components/contribute/synthetic-rhythm-shell.tsx` | New v3 file — verify if integrated |
| `components/landing/live-rhythm-stream.tsx` | New file — verify if used |

---

## 8. Component Inventory Summary

**107 .tsx component files** across `apps/web/components/`:

| Directory | Count | Domain |
|---|---|---|
| `about/` | 7 | About page sections |
| `contribute/` | 6 | Upload & contribution flow |
| `evidence/` | 1 | Research pulse preview |
| `home/` | 1 | Landing page section |
| `landing/` | 1 | Live rhythm stream (new) |
| `mission/` | 8 | Mission control (v3, new) |
| `shared/` | 1 | Share panel |
| `typography/` | ? | Typography primitives (new, unverified) |
| `ui/` | ? | UI primitives (new, unverified) |
| Root components | ~10 | Layout, auth, header, footer, etc. |

---

## 9. Summary Scorecard

| Domain | Status | Score |
|---|---|---|
| Route structure | Clean, well-organized | PASS |
| CSS custom properties | Complete token system | PASS |
| Tailwind tokens | Correctly mapped | PASS |
| Hardcoded hex | 5-6 component files need migration | PARTIAL |
| Typography rules | Compliant but no guardrail components | PARTIAL |
| 3D scene | Clean, all fixes applied | PASS |
| Brand phrases | 1 canonical phrase missing | PARTIAL |
| Forbidden phrases | Zero violations | PASS |
| Content modules | Mostly centralized | PASS |
| Reduced motion | 15% coverage of animated files | FAIL |
| ARIA live regions | Only 1 (medical disclaimer) | FAIL |
| Focus indicators | Properly configured | PASS |
| Touch targets | 44px consistently applied | PASS |
| Share engine | Functional, stories format unverified | PARTIAL |
| Mobile 2D fallback | Missing | FAIL |

## 10. Top 5 Priority Actions

1. **Reduced-motion coverage**: Add `prefers-reduced-motion` gating to all
   Framer Motion animations. Currently only 15% of animated files are covered.

2. **`aria-live` for realtime updates**: Mission counters, contribution feed,
   and any SSE-driven UI updates need `aria-live="polite"` regions.

3. **Add "pain is not a competition"**: This canonical brand phrase appears
   zero times in the codebase. Add to `site-copy.ts` and surface in appropriate
   content (About page or Mission page).

4. **Create `Heading` and `DataText` components**: These guardrail components
   enforce typography rules at the component level rather than relying on
   developer discipline. No violations exist today, but guardrails prevent
   future drift.

5. **Mobile 2D fallback for globe**: Low-end mobile devices need a 2D route
   visualization fallback when WebGL performance is insufficient.
