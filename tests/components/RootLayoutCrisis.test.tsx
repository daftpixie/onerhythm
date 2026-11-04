// The crisis control must be reachable from every screen — including the
// moments BEFORE the app shell renders. a11y-reviewer (2026-10-29) found that
// app/_layout.tsx returned null while fonts loaded, so a slow or hung font
// load meant a blank screen with no crisis help at all. A silent failure here
// is a SAFETY incident (a11y.md).
import React from "react";
import { act, fireEvent, render, renderHook } from "@testing-library/react-native";
import { crisisHelpSheet as C } from "../shared/contracts/crisis-help-sheet";

jest.mock("@expo-google-fonts/atkinson-hyperlegible", () => ({
  // Fonts that never finish loading: neither loaded nor errored.
  useFonts: () => [false, null],
  AtkinsonHyperlegible_400Regular: 1,
  AtkinsonHyperlegible_700Bold: 2,
}));
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(async () => {}),
}));
// usePathname: the root layout clears stale status messages on navigation.
// Navigator/useRouter: the root layout hosts the landing-build route gate
// (ADR 0023) inside a custom Navigator. Both are inert here.
jest.mock("expo-router", () => ({
  Slot: () => null,
  usePathname: () => "/",
  useRouter: () => ({ replace: jest.fn() }),
  Navigator: ({ children }: { children: unknown }) => children,
}));
// Test harness only: under jest fake timers expo-status-bar keeps scheduling
// timers, so advancing the clock never returns. It draws nothing we assert on.
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("../../global.css", () => ({}), { virtual: true });
// Auth talks to Supabase storage; this test is about the shell, not sign-in.
jest.mock("../../src/lib/auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { FONT_LOAD_TIMEOUT_MS, useAppFonts } from "../../src/hooks/useFonts";
import RootLayout from "../../app/_layout";

describe("font loading never hides crisis help", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("gives up waiting for fonts after a bounded time", () => {
    const { result } = renderHook(() => useAppFonts());
    expect(result.current.fontsSettled).toBe(false);
    act(() => {
      jest.advanceTimersByTime(FONT_LOAD_TIMEOUT_MS);
    });
    expect(result.current.fontsSettled).toBe(true);
  });

  it("waits no longer than a few seconds", () => {
    expect(FONT_LOAD_TIMEOUT_MS).toBeGreaterThan(0);
    expect(FONT_LOAD_TIMEOUT_MS).toBeLessThanOrEqual(5000);
  });

  it("shows the plain crisis fallback while fonts are still loading", () => {
    const { getByText } = render(<RootLayout />);
    expect(getByText(C.fallback.text)).toBeTruthy();
  });

  it("hides the native splash while loading, so the fallback is actually seen", () => {
    const splash = jest.requireMock("expo-splash-screen") as { hideAsync: jest.Mock };
    splash.hideAsync.mockClear();
    const { getByTestId } = render(<RootLayout />);
    fireEvent(getByTestId("crisis-loading"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 640 } },
    });
    expect(splash.hideAsync).toHaveBeenCalled();
  });

  it("renders the full shell, with the crisis trigger, once the wait ends", () => {
    const view = render(<RootLayout />);
    act(() => {
      jest.advanceTimersByTime(FONT_LOAD_TIMEOUT_MS);
    });
    expect(
      view.getByRole("button", { name: C.trigger.accessibleName }),
    ).toBeTruthy();
  });
});
