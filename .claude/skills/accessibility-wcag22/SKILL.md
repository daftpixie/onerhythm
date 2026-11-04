---
name: accessibility-wcag22
description: Triggers on any UI/component/screen/styling work. Auto-applies WCAG 2.2 AA as a build-blocking standard.
---

# WCAG 2.2 AA Checklist — Build-Blocking

Apply to every UI change. A feature that fails any item below does not ship.

## Baseline
- [ ] Designed for: 65+, older device, reduced vision/dexterity, low tech confidence.
- [ ] White/near-white background; body text >= 16-18px; line-height >= 1.5.
- [ ] Font: Atkinson Hyperlegible or Inter.

## Contrast
- [ ] Text contrast >= 4.5:1.
- [ ] UI components and focus indicators >= 3:1.

## Touch & interaction
- [ ] All interactive targets >= 24px (SC 2.5.8).
- [ ] Primary action targets >= 44px.
- [ ] Visible focus ring on every focusable element (never removed).
- [ ] Dragging alternatives provided where dragging is used.

## Content
- [ ] Plain language (~8th-grade reading level).
- [ ] Icon + TEXT label always — never icon-only.

## Motion
- [ ] No autoplay, no carousels, no ambient/looping motion.
- [ ] `prefers-reduced-motion` honored everywhere.

## WCAG 2.2 new criteria
- [ ] Focus Not Obscured (SC 2.4.11).
- [ ] Consistent Help (SC 3.2.6).
- [ ] Redundant Entry (SC 3.3.7).
- [ ] Accessible Authentication (magic links/passkeys satisfy SC 3.3.8).

## Safety
- [ ] Crisis affordance reachable from every screen.
- [ ] Silent failure to render crisis affordance = SAFETY incident.

## Gate
- [ ] Automated axe scan passes.
- [ ] Manual keyboard navigation pass.
- [ ] Screen-reader pass.
- [ ] a11y-reviewer subagent invoked and PASS confirmed.
