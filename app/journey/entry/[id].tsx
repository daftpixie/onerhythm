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
  addUpbeat,
  deleteJourneyEntry,
  getJourneyEntry,
  listMyUpbeats,
  removeUpbeat,
  setJourneyPublished,
  type JourneyEntry,
} from "../../../src/lib/social";
import { JourneyEntryView } from "../../../src/components/JourneyEntryView";
import { type PressState } from "../../../src/lib/pressable";
import { tokens, focus } from "../../../src/theme/tokens";

// One journey entry, read in full. RLS decides visibility (published or own);
// when it says no, we show a gentle not-found rather than leaking whether a
// draft exists.
export default function JourneyEntryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, user, loading } = useAuth();
  const [entry, setEntry] = useState<JourneyEntry | null>(null);
  const [hidden, setHidden] = useState(false);
  const [upbeated, setUpbeated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (typeof id !== "string") return;
    try {
      setError(null);
      const found = await getJourneyEntry(supabase, id);
      if (!found) {
        setHidden(true);
        return;
      }
      setEntry(found);
      const mine = await listMyUpbeats(supabase, { journeyEntryIds: [id] });
      setUpbeated(mine.journeyEntryIds.includes(id));
    } catch {
      setError("We couldn't load this entry. Want to try again?");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (!loading && !session) {
        router.replace("/sign-in");
        return;
      }
      if (session) load();
    }, [loading, session, load, router]),
  );

  async function toggleUpbeat(next: boolean) {
    if (typeof id !== "string") return;
    if (next) await addUpbeat(supabase, { journeyEntryId: id });
    else await removeUpbeat(supabase, { journeyEntryId: id });
    setUpbeated(next);
  }

  async function togglePublish() {
    if (!entry) return;
    try {
      await setJourneyPublished(supabase, entry.id, !entry.is_published);
      await load();
    } catch {
      setError("We couldn't save that. Want to try again?");
    }
  }

  async function handleDelete() {
    if (!entry) return;
    try {
      await deleteJourneyEntry(supabase, entry.id);
      router.replace("/journey");
    } catch {
      setError("We couldn't delete that. Want to try again?");
    }
  }

  if (hidden) {
    return (
      <View style={styles.center}>
        <Text style={styles.help}>
          {"We couldn't find that entry. It may be private or deleted."}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to your feed"
          onPress={() => router.replace("/feed")}
          style={({ focused, pressed }: PressState) => [
            styles.quietButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.quietText}>← Your feed</Text>
        </Pressable>
      </View>
    );
  }

  if (loading || !session || !entry) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.ink} />
      </View>
    );
  }

  const isOwner = entry.author_id === user?.id;
  const authorName = entry.author?.display_name ?? "a member";

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isOwner ? "Back to my journey" : `Back to ${authorName}'s journey`
        }
        onPress={() =>
          isOwner
            ? router.push("/journey")
            : router.push(`/members/${entry.author_id}/journey`)
        }
        style={({ focused, pressed }: PressState) => [
          styles.quietButton,
          pressed && styles.pressed,
          focused && styles.focusRing,
        ]}
      >
        <Text style={styles.quietText}>
          ← {isOwner ? "My journey" : `${authorName}'s journey`}
        </Text>
      </Pressable>

      <JourneyEntryView
        entry={entry}
        isOwner={isOwner}
        upbeated={upbeated}
        onToggleUpbeat={toggleUpbeat}
        onEdit={() =>
          router.push({
            pathname: "/journey/editor",
            params: { id: entry.id },
          })
        }
        onTogglePublish={togglePublish}
        onDelete={handleDelete}
      />

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
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
    maxWidth: 688,
    width: "100%",
    alignSelf: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.paper,
    gap: 12,
    padding: 24,
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
