import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/auth";
import { DeleteAccountPanel } from "../../src/components/DeleteAccountPanel";
import { deleteMyAccount } from "../../src/lib/rights/delete-account";
import {
  collectMyData,
  exportFilename,
  serializeExport,
} from "../../src/lib/rights/export";
import { canDownload, downloadJson } from "../../src/lib/rights/download";
import { tokens } from "../../src/theme/tokens";

// B13 — account & data deletion. The panel holds the flow and the copy; this
// screen only wires it to Supabase and to the router.
export default function DeleteAccountScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [deleted, setDeleted] = useState(false);
  const [exportError, setExportError] = useState(false);

  // Deleting the account ends the session, which nulls `session` here via the
  // auth listener. A plain `deleted` state is NOT enough to guard the redirect
  // below: both updates are async and the sign-out can commit first, which
  // would bounce the member to /sign-in instead of telling them it worked —
  // the one moment they most need a clear answer. A ref mutates synchronously,
  // so the guard is already true before any listener can fire.
  const leaving = useRef(false);
  const doneHeadingRef = useRef<View>(null);

  // When deletion succeeds the whole subtree is replaced, so the element that
  // held focus is unmounted and focus silently falls back to the document body.
  // A live region does not save this either: a region mounted with its text
  // ALREADY inside it is not announced by most screen readers — only a change
  // within an already-mounted region is. So the confirmation of the single most
  // consequential action in the app would be met with total silence.
  // Move focus explicitly — that is the load-bearing mechanism on both
  // platforms. The announce below is NATIVE-ONLY insurance:
  // AccessibilityInfo.announceForAccessibility is an empty stub in
  // react-native-web 0.21.2 (pinned by tests/unit/rnw-a11y-contract.test.ts),
  // so it must never be the only way a message reaches someone on web.
  useEffect(() => {
    if (!deleted) return;
    (doneHeadingRef.current as { focus?: () => void } | null)?.focus?.();
    AccessibilityInfo.announceForAccessibility(
      "Deletion complete. Your account and your data are gone, and you are signed out.",
    );
  }, [deleted]);

  useEffect(() => {
    if (!loading && !session && !leaving.current) router.replace("/sign-in");
  }, [loading, session, router]);

  const exportNow = useCallback(async () => {
    setExportError(false);
    try {
      const doc = await collectMyData(supabase);
      downloadJson(exportFilename(new Date()), serializeExport(doc));
    } catch {
      setExportError(true);
    }
  }, []);

  if (deleted) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        {/* focusable so focus can actually LAND here on web — react-native-web
            maps `focusable` to tabIndex, and a plain <Text> is not a focus
            target. `accessible` makes it one node so the role is exposed. */}
        <View
          ref={doneHeadingRef}
          focusable
          accessible
          accessibilityRole="header"
          aria-level={1}
        >
          <Text style={styles.heading}>Deletion complete</Text>
        </View>
        <View accessibilityLiveRegion="polite" style={styles.section}>
          <Text style={styles.body}>
            Your account and your data are gone, and you&apos;re signed out.
          </Text>
          <Text style={styles.body}>
            Thank you for being here. You&apos;re welcome back any time.
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (loading || !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.ink} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <DeleteAccountPanel
        onExport={() => void exportNow()}
        onDelete={async () => {
          leaving.current = true;
          try {
            await deleteMyAccount(supabase);
            setDeleted(true);
          } catch (e) {
            // Nothing was deleted, so the screen must behave normally again —
            // including redirecting if the session really does end later.
            leaving.current = false;
            throw e; // the panel owns the error message
          }
        }}
        onCancel={() => router.back()}
      />

      {!canDownload() ? (
        <Text style={styles.body}>
          Downloading your data is available on the OneRhythm website.
        </Text>
      ) : null}
      {exportError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {"We couldn't build your download just now. Nothing was changed. Want to try again?"}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: tokens.paper },
  container: {
    padding: 24,
    gap: 12,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.paper,
  },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  section: {
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  error: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.pulse,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
});
