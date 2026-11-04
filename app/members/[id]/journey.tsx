import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/lib/auth";
import {
  listMemberJourneyEntries,
  type JourneyEntry,
} from "../../../src/lib/social";
import { JourneyEntryCard } from "../../../src/components/JourneyEntryCard";
import { type PressState } from "../../../src/lib/pressable";
import { tokens, focus } from "../../../src/theme/tokens";

// Another member's journey (wireframe B7): PUBLISHED entries only — drafts
// are invisible to everyone but their owner (RLS). Header shows the display
// name only this slice ("member since · communities" needs other-member
// membership visibility — deferred, ADR 0009).
export default function MemberJourneyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, user, loading } = useAuth();
  const [entries, setEntries] = useState<JourneyEntry[] | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (typeof id !== "string") return;
    try {
      setError(null);
      const [list, profile] = await Promise.all([
        listMemberJourneyEntries(supabase, id),
        supabase
          .from("profiles")
          .select("display_name")
          .eq("id", id)
          .maybeSingle(),
      ]);
      setEntries(list);
      setDisplayName(profile.data?.display_name ?? "A member");
    } catch {
      setError("We couldn't load this journey. Want to try again?");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (!loading && !session) {
        router.replace("/sign-in");
        return;
      }
      if (session) {
        // your own link lands on the manage view instead
        if (typeof id === "string" && user?.id === id) {
          router.replace("/journey");
          return;
        }
        load();
      }
    }, [loading, session, load, router, id, user?.id]),
  );

  if (loading || !session || entries === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.ink} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
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

      <Text style={styles.heading} accessibilityRole="header">
        {displayName ?? "A member"}&apos;s journey
      </Text>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {entries.length === 0 ? (
        <Text style={styles.help}>
          {`${displayName ?? "This member"} hasn't published any journey entries yet.`}
        </Text>
      ) : (
        <View style={styles.list}>
          {entries.map((entry) => (
            <JourneyEntryCard
              key={entry.id}
              entry={entry}
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
  list: { gap: 12 },
  error: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  quietButton: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
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
