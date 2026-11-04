import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/auth";
import { AppealForm } from "../../src/components/moderation/AppealForm";
import {
  askAgain,
  getGates,
  myModerationNotices,
  tierOfNotice,
  type Gates,
} from "../../src/lib/moderation/api";
import { type PressState } from "../../src/lib/pressable";
import { focus, tokens } from "../../src/theme/tokens";

// "Ask us to look again" — its own page (ADR 0022). Tier 1 actions go to the
// appeals panel; Tier 3 (safety floor) actions are never put to a vote and go
// to a trained person instead (ADR 0021).
//
// The tier comes from the member's own notice for this action, never from the
// URL. If it cannot be told, it fails closed to Tier 3. The database refuses a
// panel appeal for a Tier 3 action either way (submit_appeal); this keeps the
// copy honest.
export default function AppealScreen() {
  const router = useRouter();
  const { actionId } = useLocalSearchParams<{ actionId: string }>();
  const { session, loading } = useAuth();
  const [gates, setGates] = useState<Gates | null>(null);
  const [tier, setTier] = useState<1 | 3>(3);
  const [failed, setFailed] = useState(false);
  const backRef = useRef<View>(null);

  const load = useCallback(async () => {
    // "Try again" is about to disappear: keep focus on the page, never on body.
    if (failed) (backRef.current as unknown as { focus?: () => void } | null)?.focus?.();
    setFailed(false);
    try {
      const [g, notices] = await Promise.all([getGates(supabase), myModerationNotices(supabase)]);
      setTier(tierOfNotice(notices.find((n) => n.action_id === actionId)));
      setGates(g);
    } catch {
      setFailed(true);
    }
  }, [actionId, failed]);

  useFocusEffect(
    useCallback(() => {
      if (!loading && !session) {
        router.replace("/sign-in");
        return;
      }
      if (session) load();
    }, [loading, session, load, router]),
  );

  const back = (
    <Pressable
      ref={backRef}
      role="button"
      accessibilityRole="button"
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/feed"))}
      style={({ focused, pressed }: PressState) => [
        styles.button,
        pressed && styles.pressed,
        focused && styles.focusRing,
      ]}
    >
      <Text style={styles.buttonText}>Back</Text>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        {back}
        {failed ? (
          <>
            <Text role="heading" aria-level={1} style={styles.heading}>
              Ask us to look again
            </Text>
            <Text role="alert" style={styles.body}>
              We couldn&apos;t load this page. Nothing was sent.
            </Text>
            <Pressable
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
        ) : !gates || typeof actionId !== "string" ? (
          <>
            <Text role="heading" aria-level={1} style={styles.heading}>
              Ask us to look again
            </Text>
            <ActivityIndicator color={tokens.ink} accessibilityLabel="Loading" aria-label="Loading" />
          </>
        ) : (
          <AppealForm
            actionId={actionId}
            gates={{ G1: gates.G1, G2: gates.G2 }}
            tier={tier}
            onSubmit={(statement) => askAgain(supabase, { actionId, statement, tier })}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: {
    fontSize: 20,
    lineHeight: 30,
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
    alignSelf: "flex-start",
    justifyContent: "center",
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
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
