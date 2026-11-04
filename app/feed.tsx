import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/lib/auth";
import { useFolding } from "../src/lib/moderation/useFolding";
import { getFeed, type PostListItem } from "../src/lib/social";
import { PostCard } from "../src/components/PostCard";
import { type PressState } from "../src/lib/pressable";
import { tokens, focus } from "../src/theme/tokens";

// Home feed (wireframe B4/C4): posts from the member's JOINED communities,
// newest first — no ranking of any kind. Freshness comes from fetch-on-focus
// plus pull-to-refresh and an explicit Refresh button (realtime is a
// deliberate deferral — ADR 0006).
export default function FeedScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  // Muted words and the crisis gate fold posts here too, matched on this device.
  const { ready: foldingReady, foldFor } = useFolding();
  const [posts, setPosts] = useState<PostListItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setPosts(await getFeed(supabase));
    } catch {
      setError("We couldn't load your feed. Want to try again?");
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

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading || !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.ink} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.heading} accessibilityRole="header">
          Your feed
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh your feed"
          onPress={refresh}
          style={({ focused, pressed }: PressState) => [
            styles.quietButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.quietText}>⟳ Refresh</Text>
        </Pressable>
      </View>

      <View style={styles.navRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Browse communities"
          onPress={() => router.push("/communities")}
          style={({ focused, pressed }: PressState) => [
            styles.quietButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.quietText}>◇ Communities</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="My journey"
          onPress={() => router.push("/journey")}
          style={({ focused, pressed }: PressState) => [
            styles.quietButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.quietText}>✎ My journey</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share something"
          onPress={() => router.push("/compose")}
          style={({ focused, pressed }: PressState) => [
            styles.primaryButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.primaryText}>+ Share something</Text>
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {posts === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.ink} />
        </View>
      ) : (
        <FlatList
          // Held empty until the fold lists load, so no folded title flashes.
          data={foldingReady ? posts : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              fold={foldFor(item, session?.user.id)}
              onPress={() => router.push(`/posts/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Nothing here yet. Join a community to see posts from people who
                get it.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Browse communities"
                onPress={() => router.push("/communities")}
                style={({ focused, pressed }: PressState) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                  focused && styles.focusRing,
                ]}
              >
                <Text style={styles.secondaryText}>Browse communities</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.paper },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.paper,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 8,
    flexWrap: "wrap",
  },
  list: { padding: 24, paddingTop: 8, gap: 12 },
  empty: { gap: 12, paddingVertical: 24, alignItems: "flex-start" },
  emptyText: {
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
    paddingHorizontal: 24,
    paddingVertical: 8,
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
  secondaryButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: tokens.paper,
  },
  secondaryText: {
    color: tokens.ink,
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
