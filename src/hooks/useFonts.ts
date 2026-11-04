import { useCallback, useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts as useAtkinson,
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from "@expo-google-fonts/atkinson-hyperlegible";
SplashScreen.preventAutoHideAsync();

/**
 * The longest we wait for Atkinson Hyperlegible before rendering with the
 * system font. Until fonts settle the app shows only the plain crisis
 * fallback, so a slow or hung font load can never leave a blank screen with no
 * crisis help (a11y.md; a11y-reviewer 2026-10-29).
 */
export const FONT_LOAD_TIMEOUT_MS = 4000;

export function useAppFonts() {
  const [atkinsonLoaded, atkinsonError] = useAtkinson({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });
  // Atkinson Hyperlegible is the ONLY typeface (Brand v3 §4/§10.1, pinned by
  // tests/unit/typeface.test.tsx). Inter used to be loaded here as a UI face
  // and was referenced by nothing in the tree — three font files downloaded on
  // every cold start, on the older devices this is built for, to render
  // nothing. v3 follow-up #4.
  const fontsReady = atkinsonLoaded;
  const fontError = atkinsonError;

  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (fontsReady || fontError) return;
    const t = setTimeout(() => setTimedOut(true), FONT_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [fontsReady, fontError]);

  /** Loaded, failed, or waited long enough: render the app either way. */
  const fontsSettled = Boolean(fontsReady || fontError || timedOut);

  const onLayoutRootView = useCallback(async () => {
    if (fontsSettled) {
      // A rejection here must never affect what renders.
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsSettled]);

  return { fontsReady, fontError, fontsSettled, onLayoutRootView };
}
