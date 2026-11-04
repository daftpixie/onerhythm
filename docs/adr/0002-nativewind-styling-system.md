# ADR 0002 — NativeWind v4 as the cross-platform styling system

Status: **Superseded in part by ADR 0010** (2026-08-06)

> **The premise below never shipped.** There is not a single NativeWind
> `className` in `app/` or `src/`; every component styles via
> `StyleSheet.create`. The Consequences section's claims — that components use
> `className` props and that `tailwind.config.js` is the token source of truth —
> were never true in practice, and the config's `colors` block was read by
> nothing. Colour tokens now live in `src/theme/tokens.ts` (ADR 0010, guard #7).
>
> Whether to adopt NativeWind classNames at all is an open architectural
> question deferred to its own session. NativeWind remains installed and still
> compiles the `@tailwind` directives in `global.css`.

## Context
OneRhythm uses Expo (React Native + RN Web) for a single codebase across iOS,
Android, and web. The Brand Guidelines v2 define a complete design token set
(colors, type, radii, motion) and provide a ready-made Tailwind config snippet
in §12. We need a styling system that maps these tokens consistently across all
three platforms.

## Decision
Use NativeWind v4, which brings Tailwind CSS utility classes to React Native
and React Native Web.

## Rationale
- Brand v2 §12 was written with Tailwind tokens in mind — the config maps 1:1.
- NativeWind v4 compiles Tailwind at build time via Metro, so there is no
  runtime overhead.
- Utility-first classes keep component files readable and co-located with the
  token system.

## Alternatives considered
- **StyleSheet + manual tokens:** More boilerplate, no utility classes, harder
  to keep in sync with the Tailwind config the brand guide provides.
- **Tamagui:** Heavier, different mental model, larger bundle.
- **Unistyles:** Newer ecosystem, less community adoption.

## Consequences
- All components use `className` props (NativeWind) rather than `style` objects.
- The `tailwind.config.js` at the repo root is the single source of truth for
  design tokens.
- `global.css` provides CSS custom properties for web and the
  `prefers-reduced-motion` media query.
