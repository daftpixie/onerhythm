# Public Heart Mosaic

This document defines the launch-facing behavior of the public Heart Mosaic.

## Public contract

- `GET /v1/mosaic/stats` returns anonymous aggregate metadata only.
- `GET /v1/mosaic/tiles` returns anonymous tile metadata only.
- Public responses never expose `profile_id`, `upload_session_id`, raw upload
  references, or any join path back to self-reported profile records.
- Public tile metadata includes `tile_version` and `render_version` so future
  artistic derivation strategies can coexist without changing the anonymity
  boundary.

## Launch render strategy

- The homepage renders a deterministic heart layout from stored tile metadata.
- Tile metadata is derived from a transformed abstract artifact, not from the raw or merely redacted ECG upload.
- The public contract stores visual-style metadata plus derivation-version
  metadata; the transformed artifact itself remains temporary and private.
- The current launch render limit is `45` tiles.
- If more public tiles exist than the launch render window, the API reports that
  state through `has_more_public_tiles` so the UI can describe the capped view
  honestly.
- Smaller screens fall back to a simpler 2D grid instead of forcing the heart
  layout into an unreadable mobile arrangement.
- This keeps the current DOM-based implementation stable while leaving room for
  a future canvas or WebGL renderer without changing the public API.

## Accessibility

- The mosaic includes a visible text alternative panel.
- The selected tile detail is mirrored into `aria-live` updates for screen
  readers.
- A non-visual summary describes the current public state, including empty and
  degraded cases.
- High-contrast mode increases border clarity, removes decorative blur, and
  suppresses low-opacity tiles.
- Reduced-motion mode disables the ambient heartbeat animation.

## Launch states

- `loading`: route-level skeleton shown while the homepage is resolving.
- `ready`: render the deterministic layout and tile details.
- `empty`: show a first-contribution waiting state.
- `degraded`: show a calm fallback when public stats or tile listing cannot be
  fetched.

## Performance guardrails

- Homepage fetches are capped to the current launch render window.
- Placement is deterministic and purely metadata-driven.
- The MVP does not optimize for `100k` tiles yet; it optimizes for a modest
  public launch population and a clean migration path to higher-scale rendering.
