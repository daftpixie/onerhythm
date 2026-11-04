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
  joinCommunity,
  leaveCommunity,
  listCommunities,
  listMyMembershipCommunityIds,
  type CommunitySummary,
} from "../../src/lib/social";
import { CommunityRow } from "../../src/components/CommunityRow";
import { type PressState } from "../../src/lib/pressable";
import { tokens, focus } from "../../src/theme/tokens";

// Browse & discover (wireframe C5 / web sidebar). Community names and
// descriptions are the approved SIGNED-OUT surface; joining and everything
// deeper needs a session.
export default function CommunitiesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [communities, setCommunities] = useState<CommunitySummary[] | null>(
    null,
  );
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [all, mine] = await Promise.all([
        listCommunities(supabase),
        listMyMembershipCommunityIds(supabase),
      ]);
      setCommunities(all);
      setJoinedIds(mine);
    } catch {
      setError("We couldn't load the communities. Want to try again?");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function toggleJoin(community: CommunitySummary) {
    if (busyId) return;
    setBusyId(community.id);
    const joined = joinedIds.includes(community.id);
    try {
      if (joined) {
        await leaveCommunity(supabase, community.id);
        setJoinedIds((ids) => ids.filter((id) => id !== community.id));
      } else {
        await joinCommunity(supabase, community.id);
        setJoinedIds((ids) => [...ids, community.id]);
      }
    } catch {
      setError("We couldn't save that. Want to try again?");
    } finally {
      setBusyId(null);
    }
  }

  const joined = (communities ?? []).filter((c) => joinedIds.includes(c.id));
  const discover = (communities ?? []).filter(
    (c) => !joinedIds.includes(c.id),
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.heading} accessibilityRole="header">
        Communities
      </Text>
      <Text style={styles.help}>
        Spaces organized by diagnosis, plus rooms for caregivers and everyone.
        You can join as many as you like — or none. Nothing here requires
        sharing your health story.
      </Text>

      {!session ? (
        <View style={styles.signedOutBand}>
          <Text style={styles.help}>
            You can look around freely. To read posts and join in, sign in
            first.
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
      ) : null}

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {communities === null ? (
        <ActivityIndicator color={tokens.ink} />
      ) : (
        <>
          {joined.length > 0 ? (
            <>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Your communities
              </Text>
              <View style={styles.list}>
                {joined.map((community) => (
                  <CommunityRow
                    key={community.id}
                    community={community}
                    joined
                    canJoin={Boolean(session)}
                    busy={busyId === community.id}
                    onOpen={() => router.push(`/communities/${community.slug}`)}
                    onToggleJoin={() => toggleJoin(community)}
                  />
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.sectionTitle} accessibilityRole="header">
            Discover
          </Text>
          <View style={styles.list}>
            {discover.map((community) => (
              <CommunityRow
                key={community.id}
                community={community}
                joined={false}
                canJoin={Boolean(session)}
                busy={busyId === community.id}
                onOpen={() => router.push(`/communities/${community.slug}`)}
                onToggleJoin={() => toggleJoin(community)}
              />
            ))}
          </View>
        </>
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
  heading: {
    fontSize: 24,
    lineHeight: 32,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginTop: 8,
  },
  help: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignSelf: "flex-start",
  },
  primaryText: {
    color: tokens.paper,
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
