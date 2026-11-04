import "../global.css";
import { useEffect } from "react";
import { Navigator, Slot, usePathname, useRouter } from "expo-router";
import { Text, View } from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
  type Metrics,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAppFonts } from "../src/hooks/useFonts";
import { AppShell } from "../src/components/AppShell";
import { CrisisHelpFallback } from "../src/components/CrisisHelpSheet";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "../src/lib/auth";
import { StatusRegionProvider } from "../src/components/StatusRegion";
import { isLandingMode, isLandingPath } from "../src/lib/site";
import { tokens } from "../src/theme/tokens";

// Without initial metrics the provider renders NOTHING until it has measured
// the insets — a blank first frame with no crisis help. Zero insets are a safe
// first guess; the provider corrects them on its first measurement.
const FIRST_FRAME_METRICS: Metrics = initialWindowMetrics ?? {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/**
 * The landing-only build's route gate (ADR 0023). Default-deny: a path outside
 * LANDING_PATHS never renders its screen. It is replaced, inside the shell
 * (so crisis help stays in the header), by a one-line notice while the router
 * moves to "/". The gate sits in the layout, not in links: a typed or pasted
 * URL is stopped the same way as a tap.
 */
function RouteGate() {
  const pathname = usePathname();
  const router = useRouter();
  const blocked = isLandingMode() && !isLandingPath(pathname);

  useEffect(() => {
    if (blocked) router.replace("/");
  }, [blocked, router]);

  if (blocked) {
    return (
      // A polite status, so a screen reader hears why the page changed.
      <Text
        role="status"
        aria-live="polite"
        style={{
          padding: 16,
          fontSize: 18,
          lineHeight: 27,
          color: tokens.ink,
          fontFamily: "AtkinsonHyperlegible_400Regular",
        }}
      >
        Taking you to the home page.
      </Text>
    );
  }
  return <Slot />;
}

export default function RootLayout() {
  const { fontsSettled, onLayoutRootView } = useAppFonts();
  // Clears a status message left from the last screen (a11y follow-up 3).
  const pathname = usePathname();

  // Never render nothing: until fonts settle (bounded by FONT_LOAD_TIMEOUT_MS)
  // the plain crisis fallback is on screen, so crisis help is reachable from
  // the very first frame.
  if (!fontsSettled) {
    return (
      <SafeAreaProvider initialMetrics={FIRST_FRAME_METRICS}>
        {/* Hide the native splash as soon as this lays out, or it would
            cover the fallback for the whole wait. */}
        <SafeAreaView
          testID="crisis-loading"
          style={{ flex: 1, padding: 16 }}
          onLayout={() => {
            SplashScreen.hideAsync().catch(() => {});
          }}
        >
          <CrisisHelpFallback />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={FIRST_FRAME_METRICS}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <StatusBar style="dark" />
        <AuthProvider>
          <StatusRegionProvider resetKey={pathname}>
            {/* A custom Navigator, so the router is mounted before RouteGate
                can redirect, and so the gate decides whether the screen
                renders at all — not the screen itself. */}
            <Navigator>
              <AppShell>
                <RouteGate />
              </AppShell>
            </Navigator>
          </StatusRegionProvider>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
