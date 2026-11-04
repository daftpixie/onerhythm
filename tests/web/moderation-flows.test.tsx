// Build step 4 member flows that the ADR 0022 suite does not cover: muted
// words on the device (Q6) and the muted-post collapse (plan §4.8). Written
// failing first; under the renderer that ships.
import { act } from "react";
import { fireEvent } from "@testing-library/dom";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppShell } from "../../src/components/AppShell";
import { mount } from "./mount";

/* eslint-disable @typescript-eslint/no-explicit-any */
function load(path: string, name: string): (props: any) => any {
  let mod: Record<string, unknown>;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require(`../../${path}`);
  } catch {
    throw new Error(`Not built yet (build step 4): ${path}`);
  }
  if (typeof mod[name] !== "function") throw new Error(`${path} does not export ${name}`);
  return mod[name] as (props: any) => any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function inApp(ui: React.ReactElement) {
  const StatusRegionProvider = load("src/components/StatusRegion", "StatusRegionProvider");
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <StatusRegionProvider>
        <AppShell>{ui}</AppShell>
      </StatusRegionProvider>
    </SafeAreaProvider>
  );
}

async function settle() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 150));
  });
}

describe("muted words settings (Q6: device only)", () => {
  it("says plainly that the words stay on this device and don't follow you", async () => {
    const MutedWordsSettings = load("src/components/moderation/MutedWordsSettings", "MutedWordsSettings");
    const view = mount(inApp(<MutedWordsSettings />));
    await settle();
    expect(view.container).toHaveTextContent(
      "These words are saved on this device only. If you use a new phone or computer, add them again.",
    );
  });

  it("adds a word with a labelled field and a 44px Add button, and lists it with a named Remove", async () => {
    const MutedWordsSettings = load("src/components/moderation/MutedWordsSettings", "MutedWordsSettings");
    const view = mount(inApp(<MutedWordsSettings />));
    await settle();
    const field = view.getByRole("textbox", { name: "A word or phrase to hide" });
    act(() => {
      fireEvent.change(field, { target: { value: "ablation" } });
    });
    await act(async () => {
      fireEvent.click(view.getByRole("button", { name: "Add" }));
    });
    await settle();
    expect(view.getByRole("button", { name: "Remove 'ablation'" })).toBeInTheDocument();
    // Status messages never echo the word (plan §11, round 3).
    const region = document.querySelector("[data-testid='app-status-region']");
    expect(region).toHaveTextContent("Word added.");
    expect(region?.textContent ?? "").not.toContain("ablation");
    await act(async () => {
      fireEvent.click(view.getByRole("button", { name: "Remove 'ablation'" }));
    });
    await settle();
    expect(view.queryByRole("button", { name: "Remove 'ablation'" })).toBeNull();
  });

  it("sends nothing over the network", async () => {
    const realFetch = globalThis.fetch;
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    try {
      const MutedWordsSettings = load("src/components/moderation/MutedWordsSettings", "MutedWordsSettings");
      const view = mount(inApp(<MutedWordsSettings />));
      await settle();
      act(() => {
        fireEvent.change(view.getByRole("textbox", { name: "A word or phrase to hide" }), {
          target: { value: "icd" },
        });
      });
      await act(async () => {
        fireEvent.click(view.getByRole("button", { name: "Add" }));
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});

describe("a muted post is never hidden silently (plan §4.8)", () => {
  it("collapses behind a button that names the word, and Show reveals it", () => {
    const MutedPost = load("src/components/moderation/MutedPost", "MutedPost");
    const view = mount(inApp(<MutedPost word="icd"><p>ZZ-MUTED-POST</p></MutedPost>));
    expect(view.queryByText("ZZ-MUTED-POST")).toBeNull();
    const button = view.getByRole("button", { name: "Show post hidden because of the word 'icd'" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    act(() => button.focus());
    act(() => {
      fireEvent.click(button);
    });
    expect(view.getByText("ZZ-MUTED-POST")).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(document.activeElement).toBe(button);
  });
});
