import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type PressState } from "../lib/pressable";
import { tokens, focus } from "../theme/tokens";

export interface ConsentHistoryRow {
  id: string;
  purpose: string;
  policy_version: string;
  granted_at: string;
  withdrawn_at: string | null;
}

export interface ConsentTag {
  id: string;
  label: string;
}

export interface ConsentManagerProps {
  status: "on" | "off";
  tags: ConsentTag[];
  history: ConsentHistoryRow[];
  onWithdraw: () => Promise<unknown>;
  onExport: () => void;
  onDeleteAccount: () => void;
  /** Test seam: reports which control took focus ("keep" | "trigger"). */
  onFocusForTest?: (who: string) => void;
}

const PURPOSE_LABEL: Record<string, string> = {
  health_self_id: "Health self-identification",
};

function plainDate(iso: string): string {
  // Deliberately not locale-dependent: "12 Apr 2026" reads the same everywhere
  // and cannot be misread as month/day the wrong way round.
  const d = new Date(iso);
  const month = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][d.getUTCMonth()];
  return `${d.getUTCDate()} ${month} ${d.getUTCFullYear()}`;
}

// B14 — consent management & withdrawal.
//
// 1C shipped status plus a bare turn-off. This completes it: the versioned
// history, a confirmation before the tag purge, and the links to the other two
// rights. Withdrawal is one tap and is honoured — turning off is exactly as
// easy as turning on, which is the whole point.
//
// consent_purpose has exactly ONE value today, so exactly one purpose is shown.
// The wireframe's "Email notifications" row is deliberately NOT built: a toggle
// with no data model behind it is a control that lies, which is worse than an
// absent one. Pinned by tests/components/ConsentManager.test.tsx.
export function ConsentManager({
  status,
  tags,
  history,
  onWithdraw,
  onExport,
  onDeleteAccount,
  onFocusForTest,
}: ConsentManagerProps) {
  const [confirming, setConfirming] = useState(false);
  const keepRef = useRef<View>(null);
  const triggerRef = useRef<View>(null);
  const wasConfirming = useRef(false);

  useEffect(() => {
    if (confirming) {
      (keepRef.current as { focus?: () => void } | null)?.focus?.();
      onFocusForTest?.("keep");
    } else if (wasConfirming.current) {
      (triggerRef.current as { focus?: () => void } | null)?.focus?.();
      onFocusForTest?.("trigger");
    }
    wasConfirming.current = confirming;
  }, [confirming, onFocusForTest]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading} accessibilityRole="header" aria-level={1}>
        Your data &amp; consent
      </Text>
      <Text style={styles.help}>
        You&apos;re always in control. Change any of this anytime.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>
          Health self-identification
        </Text>
        <Text style={styles.help}>
          What it&apos;s for: suggesting communities you might find useful.
          Never sold. Never shared.
        </Text>
        <Text style={styles.status}>{`Status: ${status === "on" ? "On" : "Off"}`}</Text>

        {status === "on" ? (
          <>
            {tags.length > 0 ? (
              <Text style={styles.body}>
                {`Your tags: ${tags.map((t) => t.label).join(" · ")}`}
              </Text>
            ) : null}

            <View
              testID="withdraw-confirm"
              accessibilityLiveRegion="polite"
              style={confirming ? styles.confirmBox : null}
            >
              {confirming ? (
                <>
                <Text style={styles.confirmText}>
                  Remove your health tags?
                </Text>
                <Text style={styles.body}>
                  We&apos;ll delete your diagnosis and symptom tags and stop
                  using them to suggest communities. Your posts and account
                  stay.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove my tags"
                  onPress={() => {
                    setConfirming(false);
                    void onWithdraw();
                  }}
                  style={({ focused, pressed }: PressState) => [
                    styles.destructiveButton,
                    pressed && styles.pressed,
                    focused && styles.focusRing,
                  ]}
                >
                  <Text style={styles.destructiveText}>Remove my tags</Text>
                </Pressable>
                <Pressable
                  ref={keepRef}
                  accessibilityRole="button"
                  accessibilityLabel="Keep them"
                  onPress={() => setConfirming(false)}
                  style={({ focused, pressed }: PressState) => [
                    styles.secondaryButton,
                    pressed && styles.pressed,
                    focused && styles.focusRing,
                  ]}
                >
                  <Text style={styles.secondaryText}>Keep them</Text>
                </Pressable>
                </>
              ) : null}
            </View>
            {confirming ? null : (
              <Pressable
                ref={triggerRef}
                accessibilityRole="button"
                accessibilityLabel="Turn off and remove my tags"
                onPress={() => setConfirming(true)}
                style={({ focused, pressed }: PressState) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                  focused && styles.focusRing,
                ]}
              >
                <Text style={styles.secondaryText}>
                  Turn off &amp; remove my tags
                </Text>
              </Pressable>
            )}
          </>
        ) : (
          <Text style={styles.help}>
            You haven&apos;t added any health self-ID. You can add it anytime
            from onboarding.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>
          Consent history
        </Text>
        <Text style={styles.help}>What you agreed to, and when.</Text>
        {history.length === 0 ? (
          <Text style={styles.body}>Nothing here yet.</Text>
        ) : (
          history.map((r) => (
            <Text key={r.id} style={styles.body}>
              {`${PURPOSE_LABEL[r.purpose] ?? r.purpose} — agreed ${plainDate(
                r.granted_at,
              )} (policy ${r.policy_version})${
                r.withdrawn_at
                  ? ` · withdrawn ${plainDate(r.withdrawn_at)}`
                  : ""
              }`}
            </Text>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>
          Your data
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Download my data"
          onPress={onExport}
          style={({ focused, pressed }: PressState) => [
            styles.secondaryButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.secondaryText}>Download my data</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete my account"
          onPress={onDeleteAccount}
          style={({ focused, pressed }: PressState) => [
            styles.secondaryButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.secondaryText}>Delete my account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
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
  sectionTitle: {
    fontSize: 18,
    lineHeight: 26,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  status: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  help: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  confirmBox: {
    borderWidth: 1,
    borderColor: tokens.ink,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  confirmText: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  destructiveButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.pulse,
    backgroundColor: tokens.paper,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  destructiveText: {
    fontSize: 16,
    color: tokens.pulse,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.ink,
    backgroundColor: tokens.paper,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  secondaryText: {
    fontSize: 16,
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
