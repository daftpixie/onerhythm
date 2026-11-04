import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/auth";
import { withdrawHealthSelfIdConsent } from "../../src/lib/consent";
import {
  ConsentManager,
  type ConsentHistoryRow,
  type ConsentTag,
} from "../../src/components/ConsentManager";
import { listMyConsentHistory } from "../../src/lib/rights/consent-history";
import {
  collectMyData,
  exportFilename,
  serializeExport,
} from "../../src/lib/rights/export";
import { canDownload, downloadJson } from "../../src/lib/rights/download";
import { type PressState } from "../../src/lib/pressable";
import { tokens, focus } from "../../src/theme/tokens";

// B14 — the FULL consent surface. 1C shipped status plus a bare turn-off; this
// completes it with the versioned history, the tag-purge confirmation, and the
// links to export and deletion. Status is derived from the history rather than
// queried separately: a current consent is simply a record with no withdrawn_at.
export default function ConsentSettingsScreen() {
  const router = useRouter();
  const { session, loading, signOut } = useAuth();
  const [history, setHistory] = useState<ConsentHistoryRow[] | null>(null);
  const [tags, setTags] = useState<ConsentTag[]>([]);
  const [exportError, setExportError] = useState(false);

  useEffect(() => {
    if (!loading && !session) router.replace("/sign-in");
  }, [loading, session, router]);

  const refresh = useCallback(async () => {
    if (!session) return;
    const rows = await listMyConsentHistory(supabase);
    setHistory(rows);

    // health_self_ids is consent-gated at the DB layer: once consent is
    // withdrawn the rows are deleted by the 1B trigger, so this simply returns
    // nothing. No client-side branch needed.
    const { data } = await supabase
      .from("health_self_ids")
      .select("tag_id, self_id_tags(id, label)")
      .eq("member_id", session.user.id);
    setTags(
      (data ?? []).flatMap((r) => {
        const t = r.self_id_tags as unknown as
          | { id: string; label: string }
          | { id: string; label: string }[]
          | null;
        if (!t) return [];
        return Array.isArray(t) ? t : [t];
      }),
    );
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const exportNow = useCallback(async () => {
    setExportError(false);
    try {
      const doc = await collectMyData(supabase);
      downloadJson(exportFilename(new Date()), serializeExport(doc));
    } catch {
      setExportError(true);
    }
  }, []);

  if (loading || !session || history === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.ink} />
      </View>
    );
  }

  const current = history.some(
    (r) => r.purpose === "health_self_id" && r.withdrawn_at === null,
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <ConsentManager
        status={current ? "on" : "off"}
        tags={tags}
        history={history}
        onWithdraw={async () => {
          await withdrawHealthSelfIdConsent(supabase);
          await refresh();
        }}
        onExport={() => void exportNow()}
        onDeleteAccount={() => router.push("/settings/delete-account")}
      />

      {!canDownload() ? (
        <Text style={styles.help}>
          Downloading your data is available on the OneRhythm website.
        </Text>
      ) : null}
      {exportError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {"We couldn't build your download just now. Nothing was changed. Want to try again?"}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Words I don't want to see"
        onPress={() => router.push("/settings/muted-words")}
        style={({ focused, pressed }: PressState) => [
          styles.linkButton,
          pressed && styles.pressed,
          focused && styles.focusRing,
        ]}
      >
        <Text style={styles.linkButtonText}>Words I don&apos;t want to see</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={async () => {
          await signOut();
          router.replace("/");
        }}
        style={({ focused, pressed }: PressState) => [
          styles.linkButton,
          pressed && styles.pressed,
          focused && styles.focusRing,
        ]}
      >
        <Text style={styles.linkButtonText}>Sign out</Text>
      </Pressable>
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
  help: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  error: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.pulse,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  linkButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 10,
  },
  linkButtonText: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  pressed: { opacity: 0.85 },
  focusRing: {
    outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset,
  },
});
