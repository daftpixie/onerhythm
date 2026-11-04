// Setup for the "web" jest project (jsdom + react-native-web + react-dom).
//
// This project exists because the deploy target is a browser and the "rn"
// project cannot see one. See ADR 0014 and tests/web/mount.tsx.

// Adds toHaveAttribute / toBeVisible / toHaveAccessibleName etc. Assertions
// about the DOM read far better through these than through raw getAttribute.
import "@testing-library/jest-dom";

// Mounting the jsdom + react-native-web module graph is genuinely slow the
// first time in a worker, and slower again when three projects share the box.
// jest's 5s default was tripping on load rather than on anything real.
// (testTimeout is not valid per-project, so it lives here — same reason the db
// project sets its own in tests/db/setup.ts.)
jest.setTimeout(20000);

// React 19 requires this flag before act(). Without it React warns on every
// render and updates scheduled inside act() are not reliably flushed — which
// would make focus and live-region assertions quietly unreliable, exactly the
// failure mode this project was built to remove.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

// jsdom does not implement window.matchMedia, and every real browser does.
//
// This is not cosmetic. react-native-web's AccessibilityInfo computes
// `prefersReducedMotionMedia` once at module load from window.matchMedia; when
// it is missing, addEventListener('reduceMotionChanged') hits an early bare
// `return`, so useReducedMotion's cleanup calls `.remove()` on undefined and
// every component using it throws on unmount. That crash is an ARTEFACT OF THE
// ENVIRONMENT, not a defect in the app — so the environment gets fixed here
// rather than the app being bent around it. Without this stub the web project
// would report a browser that does not exist.
//
// Defaults to "no preference", which is the honest default for a fresh browser;
// individual tests can override .matches if they need the reduced-motion path.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });
}
