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
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/auth";
import { useFolding } from "../../src/lib/moderation/useFolding";
import {
  getCommunityBySlug,
  joinCommunity,
  leaveCommunity,
  listCommunityPosts,
  listMyMembershipCommunityIds,
  type CommunitySummary,
  type PostListItem,
} from "../../src/lib/social";
import { PostCard } from "../../src/components/PostCard";
import { type PressState } from "../../src/lib/pressable";
import { tokens, focus } from "../../src/theme/tokens";

// Community view (wireframe B5): name + description are the approved anon
// surface; the thread list requires a session (RLS returns zero rows to
// anon, and we say so plainly instead of showing an empty room).
// Member counts are deliberately absent (ADR 0006 — memberships RLS is
// self-only; a truthful count needs a reviewed aggregate, Phase 2+).
export default function CommunityScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  // Muted words and the crisis gate fold posts here too, matched on this device.
  const { ready: foldingReady, foldFor } = useFolding();
  const [community, setCommunity] = useState<CommunitySummary | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [posts, setPosts] = useState<PostListItem[] | null>(null);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (typeof slug !== "string") return;
    try {
      setError(null);
      const found = await getCommunityBySlug(supabase, slug);
      if (!found) {
        setNotFound(true);
        return;
      }
      setCommunity(found);
      if (session) {
        const [communityPosts, mine] = await Promise.all([
          listCommunityPosts(supabase, found.id),
          listMyMembershipCommunityIds(supabase),
        ]);
        setPosts(communityPosts);
        setJoined(mine.includes(found.id));
      }
    } catch {
      setError("We couldn't load this community. Want to try again?");
    }
  }, [slug, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function toggleJoin() {
    if (!community || busy) return;
    setBusy(true);
    try {
      if (joined) {
        await leaveCommunity(supabase, community.id);
        setJoined(false);
      } else {
        await joinCommunity(supabase, community.id);
        setJoined(true);
      }
    } catch {
      setError("We couldn't save that. Want to try again?");
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <View style={styles.center}>
        <Text style={styles.help}>
          {"We couldn't find that community. It may have moved."}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Browse communities"
          onPress={() => router.replace("/communities")}
          style={({ focused, pressed }: PressState) => [
            styles.secondaryButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.secondaryText}>Browse communities</Text>
        </Pressable>
      </View>
    );
  }

  if (!community) {
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
        accessibilityLabel="Back to all communities"
        onPress={() => router.push("/communities")}
        style={({ focused, pressed }: PressState) => [
          styles.quietButton,
          pressed && styles.pressed,
          focused && styles.focusRing,
        ]}
      >
        <Text style={styles.quietText}>← All communities</Text>
      </Pressable>

      <Text style={styles.heading} accessibilityRole="header">
        {community.name}
      </Text>
      {community.description ? (
        <Text style={styles.help}>{community.description}</Text>
      ) : null}

      {session ? (
        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              joined ? `Leave ${community.name}` : `Join ${community.name}`
            }
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={toggleJoin}
            style={({ focused, pressed }: PressState) => [
              styles.secondaryButton,
              pressed && styles.pressed,
              focused && styles.focusRing,
              busy && styles.disabled,
            ]}
          >
            <Text style={styles.secondaryText}>
              {joined ? "Leave" : "Join"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`New post in ${community.name}`}
            onPress={() =>
              router.push({
                pathname: "/compose",
                params: { community: community.id },
              })
            }
            style={({ focused, pressed }: PressState) => [
              styles.primaryButton,
              pressed && styles.pressed,
              focused && styles.focusRing,
            ]}
          >
            <Text style={styles.primaryText}>+ New post</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.signedOutBand}>
          <Text style={styles.help}>
            Sign in to read and share posts here. Looking around is always
            free.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            onPress={() => router.push("/sign-in")}
            style={({ focused, pressed }: PressState) => [
              styles.primaryButton,
              pressed && styles.pressed,
              focused && styles.focusRing,
            ]}
          >
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
        </View>
      )}

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {session ? (
        posts === null || !foldingReady ? (
          <ActivityIndicator color={tokens.ink} />
        ) : posts.length === 0 ? (
          <Text style={styles.help}>
            No posts here yet. Yours could be the first — no pressure.
          </Text>
        ) : (
          <View style={styles.list}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                fold={foldFor(post, session?.user.id)}
                onPress={() => router.push(`/posts/${post.id}`)}
              />
            ))}
          </View>
        )
      ) : null}
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
    gap: 12,
    padding: 24,
  },
  heading: {
    fontSize: 24,
    lineHeight: 32,
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
  signedOutBand: {
    gap: 12,
    backgroundColor: tokens.fill,
    borderRadius: 12,
    padding: 16,
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
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  focusRing: { outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset },
});
