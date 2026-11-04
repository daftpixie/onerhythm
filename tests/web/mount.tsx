// Render helper for the "web" project.
//
// Why not @testing-library/react-native: RNTL renders through
// react-test-renderer, which never mounts a DOM. Under the web preset its
// semantic queries all throw ("__fbBatchedBridgeConfig is not set"), and even
// if they did not, react-test-renderer yields DOM-SHAPED PROPS but no
// `document` — so document.activeElement, Tab order and real accessible-name
// computation stay untestable. Focus management is load-bearing in the
// delete-account flow, so that is not an acceptable gap.
//
// react-dom is what actually runs in the browser. That is the whole point:
// "test under the deploy target's renderer" means react-dom, not
// react-test-renderer.

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { within, type BoundFunctions, type queries } from "@testing-library/dom";
import type { ReactElement } from "react";

type Mounted = BoundFunctions<typeof queries> & {
  container: HTMLElement;
  /** Unmount early. Otherwise every mount is torn down after each test. */
  unmount: () => void;
};

const active: Array<{ root: Root; container: HTMLElement }> = [];

/**
 * Mount `ui` into a real detached-but-attached DOM container and return
 * @testing-library/dom queries bound to it.
 *
 * The container is appended to document.body rather than left free-floating so
 * that focus() works — jsdom refuses to focus a node outside the document, and
 * a silently unfocusable node would make every focus assertion vacuously pass.
 */
export function mount(ui: ReactElement): Mounted {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(ui);
  });

  const entry = { root, container };
  active.push(entry);

  return {
    container,
    unmount: () => teardown(entry),
    ...within(container),
  };
}

function teardown(entry: { root: Root; container: HTMLElement }) {
  const i = active.indexOf(entry);
  if (i === -1) return;
  active.splice(i, 1);
  act(() => {
    entry.root.unmount();
  });
  entry.container.remove();
}

// Registered at module scope so it applies to every file that imports mount(),
// and only to those files. Leaking a mounted tree between tests would let one
// test's focus state satisfy the next test's assertion.
afterEach(() => {
  while (active.length > 0) {
    teardown(active[active.length - 1]);
  }
  document.body.innerHTML = "";
});
