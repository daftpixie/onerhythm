# Brand System

This document is the public, repository-safe brand foundation for OneRhythm. It defines the approved visual direction, token names, and usage rules for product implementation.

Canonical narrative and campaign source:

- [OneRhythm Campaign & Content Strategy PDF](OneRhythm_Campaign_Content_Strategy.pdf)

## Brand direction

OneRhythm uses a dark-first design language that balances technical precision with emotional warmth. The intended feeling is luminous, calm, connected, and humane rather than clinical or alarmist.

Design principle:
Interfaces should feel bioluminescent, precise, and alive while remaining readable and approachable for people spending meaningful time with educational content.

## Brand qualities

- Luminous
- Connected
- Resilient
- Precise
- Alive

## Color system

### Environment

- `deep-void`: `#0A0E1A`
- `midnight`: `#111827`
- `cosmos`: `#1A1F35`
- `nebula`: `#252B48`

### Signal

- `pulse`: `#FF2D55`
- `pulse-glow`: `#FF6B8A`
- `pulse-dark`: `#CC1A3D`
- `signal`: `#00D4FF`
- `signal-soft`: `#66E5FF`
- `signal-dim`: `#0099CC`
- `aurora`: `#7C3AED`
- `aurora-glow`: `#A78BFA`

### Text and UI

- `text-primary`: `#F9FAFB`
- `text-secondary`: `#9CA3AF`
- `text-tertiary`: `#6B7280`
- `border`: `#374151`
- `success`: `#10B981`
- `warning`: `#F59E0B`

## Gradients

- `heartbeat`: `linear-gradient(135deg, #FF2D55, #CC1A3D, #7C3AED)`
- `signal-gradient`: `linear-gradient(135deg, #00D4FF, #7C3AED)`
- `void-gradient`: `radial-gradient(ellipse at center, #1A1F35, #0A0E1A)`
- `aurora-gradient`: `linear-gradient(180deg, #7C3AED, #00D4FF, #FF2D55)`

## Typography

### Font roles

- Display: `Exo 2`
- Body: `DM Sans`
- Mono: `Space Mono`

### Rules

- Use `Exo 2` for headings and display text only
- Use `DM Sans` for body copy, forms, and disclaimers
- Use `Space Mono` for IDs, hashes, and data-like UI
- Never render disclaimers below `14px`
- Keep long-form educational content readable, with generous line height and line length controls

## Radius tokens

- `radius-sm`: `4px`
- `radius-md`: `8px`
- `radius-lg`: `12px`
- `radius-xl`: `16px`
- `radius-full`: `9999px`

## Motion

- Motion should feel organic and heartbeat-inspired, not mechanical
- Respect `prefers-reduced-motion` everywhere
- Use subtle, purposeful glow and pulse effects only when they communicate state or emphasis
- Avoid decorative motion on educational content

## Accessibility rules

- Meet WCAG 2.1 AA contrast minimums
- Use visible focus states
- Support a high-contrast mode
- Do not rely on color alone for meaning
- Keep touch targets at least `44px` by `44px`

## Component guidance

### Buttons

- Primary: filled `pulse`
- Secondary: outlined `signal`
- Ghost: low-emphasis text action
- Danger: warning/destructive state only

### Cards and surfaces

- Build depth with layered dark surfaces instead of heavy shadow stacks
- Use `cosmos` and `nebula` for elevated content areas
- Keep borders subtle and consistent with `border`

### Disclaimer

- Required on every educational screen
- Persistent and non-dismissible
- Warning-accented and screen-reader accessible
- Written in measured, non-diagnostic language

## Content and imagery rules

- Generative visuals are artistic, not diagnostic
- Never label visual art as ECG analysis or medical findings
- Photography, if used, should feel warm, human, and non-clinical
- Voice should be that of a knowledgeable companion, never a doctor

Related docs:

- [Product requirements](../prd/README.md)
- [Campaign and content strategy](content-strategy/README.md)
- [Product docs](../product/README.md)
- [Architecture docs](../architecture/README.md)
