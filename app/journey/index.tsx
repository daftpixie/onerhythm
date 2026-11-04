import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/auth";
import {
  listMyJourneyEntries,
  type JourneyEntry,
} from "../../src/lib/social";
import { JourneyEntryCard } from "../../src/components/JourneyEntryCard";
import { type PressState } from "../../src/lib/pressable";
import { tokens, focus } from "../../src/theme/tokens";

// My journey (wireframe B7, own-page half): every entry — drafts and
// published — with write/manage entry points. Quiet and warm: these pages
// carry people's hardest stories.
export default function MyJourneyScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [entries, setEntries] = useState<JourneyEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setEntries(await listMyJourneyEntries(supabase));
    } catch {
      setError("We couldn't load your journey. Want to try again?");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading && !session) {
        router.replace("/sign-in");
        return;
      }
      if (session) load();
    }, [loading, session, load, router]),
  );

  if (loading || !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.ink} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.heading} accessibilityRole="header">
        My journey
      </Text>
      <Text style={styles.help}>
        {
          "Your story is yours. Publish when you're ready, or keep it as a draft forever. You can delete anything, any time."
        }
      </Text>

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Write a journey entry"
          onPress={() => router.push("/journey/editor")}
          style={({ focused, pressed }: PressState) => [
            styles.primaryButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.primaryText}>+ Write a journey entry</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to your feed"
          onPress={() => router.push("/feed")}
          style={({ focused, pressed }: PressState) => [
            styles.quietButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.quietText}>← Your feed</Text>
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {entries === null ? (
        <ActivityIndicator color={tokens.ink} />
      ) : entries.length === 0 ? (
        <Text style={styles.help}>
          Nothing here yet. Whenever you feel like telling your story — a
          little or a lot — this is your space.
        </Text>
      ) : (
        <View style={styles.list}>
          {entries.map((entry) => (
            <JourneyEntryCard
              key={entry.id}
              entry={entry}
              showStatus
              onPress={() => router.push(`/journey/entry/${entry.id}`)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: tokens.paper },
  container: {
    padding: 24,
    gap: 12,
    maxWidth: 640,
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
    lineHeight: 36,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  help: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  list: { gap: 12 },
  error: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  primaryButton: {
    backgroundColor: tokens.pulse,
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  primaryText: {
    color: tokens.paper,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  quietButton: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quietText: {
    color: tokens.ink,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  pressed: { opacity: 0.85 },
  focusRing: { outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset },
});
