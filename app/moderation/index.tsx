import { type ComponentRef, useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/auth";
import {
  ConsoleUnavailable,
  ModeratorConsole,
  type ConsoleUnavailableReason,
  type QueueItem,
} from "../../src/components/moderation/ModeratorConsole";
import {
  currentSafetyFloorItems,
  getGate,
  maxBanTermDays,
  moderateItem,
  moderationItemContent,
  moderationQueue,
} from "../../src/lib/moderation/api";
import { consoleAccess, toQueueItem } from "../../src/lib/moderation/console";
import { type PressState } from "../../src/lib/pressable";
import { focus, tokens } from "../../src/theme/tokens";

// The moderator console (build step 5; ADR 0022). Gate-aware: while G4 is
// unmet, nobody can hold a moderator grant, so the page says "No moderators
// are appointed yet" and never asks for the queue. A signed-in member without
// a current grant is told plainly they have no access.
//
// Live updates: there is no Realtime publication for moderation items yet
// (its payloads need their own review, T22). The queue is read again when the
// page gains focus and on "Check for new items". The console treats each new
// list exactly as a live update: it never moves focus or reorders.
type State =
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "unavailable"; reason: ConsoleUnavailableReason }
  | {
      kind: "ready";
      items: QueueItem[];
      subjects: Record<string, { postId: string | null; commentId: string | null }>;
      floorItems: Array<{ id: string; text: string }>;
      maxBanTermDays: number | null;
      G1: "met" | "unmet";
    };

export default function ModerationScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [state, setState] = useState<State>({ kind: "loading" });
  const tryAgainRef = useRef<ComponentRef<typeof View>>(null);

  const load = useCallback(async () => {
    try {
      const G4 = await getGate(supabase, "G4");
      if (G4 !== "met") {
        // Never ask for the queue while G4 is unmet.
        setState({ kind: "unavailable", reason: "no_moderators" });
        return;
      }
      const queue = await moderationQueue(supabase);
      const access = consoleAccess({ G4, queue: queue.refused ? "refused" : "ok" });
      if (access !== "ready" || queue.refused) {
        setState({ kind: "unavailable", reason: access === "ready" ? "not_a_moderator" : access });
        return;
      }
      const [floorItems, banDays, G1] = await Promise.all([
        currentSafetyFloorItems(supabase),
        maxBanTermDays(supabase),
        getGate(supabase, "G1"),
      ]);
      const asOf = new Date();
      setState({
        kind: "ready",
        items: queue.rows.map((r) => toQueueItem(r, asOf)),
        subjects: Object.fromEntries(
          queue.rows.map((r) => [r.item_id, { postId: r.post_id, commentId: r.comment_id }]),
        ),
        floorItems,
        maxBanTermDays: banDays,
        G1,
      });
    } catch {
      setState((s) => (s.kind === "ready" ? s : { kind: "failed" }));
    }
  }, []);

  // "Check for new items": read the queue again, say what happened. Throws on
  // failure, so the queue can show it; never fails in silence.
  const refresh = useCallback(async (): Promise<string[] | void> => {
    const queue = await moderationQueue(supabase);
    if (queue.refused) {
      // The page becomes the "no access" view; nothing to say about items.
      setState({ kind: "unavailable", reason: "not_a_moderator" });
      return;
    }
    const asOf = new Date();
    setState((s) =>
      s.kind !== "ready"
        ? s
        : {
            ...s,
            items: queue.rows.map((r) => toQueueItem(r, asOf)),
            subjects: Object.fromEntries(
              queue.rows.map((r) => [r.item_id, { postId: r.post_id, commentId: r.comment_id }]),
            ),
          },
    );
    return queue.rows.map((r) => r.item_id);
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

  if (state.kind === "unavailable") {
    return (
      <ScrollView>
        <ConsoleUnavailable reason={state.reason} />
      </ScrollView>
    );
  }

  if (state.kind !== "ready") {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text role="heading" aria-level={1} style={styles.heading}>
          Moderator console
        </Text>
        {state.kind === "loading" ? (
          // Static text, not a looping spinner (no ambient motion).
          <Text style={styles.body}>Loading.</Text>
        ) : (
          <>
            <Text role="alert" style={styles.body}>
              We couldn&apos;t load this page.
            </Text>
            <Pressable
              ref={tryAgainRef}
              role="button"
              accessibilityRole="button"
              onPress={load}
              style={({ focused, pressed }: PressState) => [
                styles.button,
                pressed && styles.pressed,
                focused && styles.focusRing,
              ]}
            >
              <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    );
  }

  const expiresAt = session?.expires_at ? session.expires_at * 1000 : undefined;
  return (
    <ScrollView>
      <ModeratorConsole
        items={state.items}
        floorItems={state.floorItems}
        maxBanTermDays={state.maxBanTermDays}
        gates={{ G1: state.G1 }}
        loadContent={(id) => {
          const subject = state.subjects[id];
          return subject ? moderationItemContent(supabase, subject) : Promise.resolve(null);
        }}
        onAction={async (id, action) => {
          await moderateItem(supabase, id, action);
          await refresh().catch(() => {});
        }}
        onRefresh={refresh}
        live={false}
        sessionExpiresAt={expiresAt}
        onStaySignedIn={async () => {
          const { error } = await supabase.auth.refreshSession();
          if (error) throw new Error(error.message);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginBottom: 8,
  },
  button: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.ink,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  pressed: { opacity: 0.85 },
  buttonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  focusRing: {
    outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset,
  },
});
