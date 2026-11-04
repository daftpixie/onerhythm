import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { type PressState } from "../lib/pressable";
import { tokens, focus } from "../theme/tokens";

export interface DeleteAccountPanelProps {
  onExport: () => void;
  onDelete: () => Promise<unknown>;
  onCancel: () => void;
  /** Test seam: reports which control took focus ("cancel" | "trigger"). */
  onFocusForTest?: (who: string) => void;
}

/**
 * The confirming word. Compared case-INSENSITIVELY and after trimming, on
 * purpose.
 *
 * The first version required an exact "DELETE". The a11y reviewer falsified it:
 * SC 3.3.4 is already satisfied by the "Last check" region below (a
 * confirm/cancel step is the sufficient technique), so the typed word is
 * defensive engineering we chose, not a requirement — which means every extra
 * strictness in it is pure cost with no accessibility return. And
 * `autoCapitalize` is only a soft-keyboard HINT: on a laptop, which is exactly
 * the "older device" persona, it does nothing at all. A member who types
 * "delete" would have been stranded with no explanation, unable to leave.
 *
 * Trimming likewise: a pasted word often carries a trailing space, and paste is
 * explicitly allowed (SC 3.3.7). There is no time limit anywhere in this flow.
 */
const CONFIRM_WORD = "DELETE";

function matchesConfirmWord(typed: string): boolean {
  return typed.trim().toUpperCase() === CONFIRM_WORD;
}

// B13 — account & data deletion.
//
// Two gates, and they do different jobs. The typed word makes the act
// deliberate; the final region makes it ANNOUNCED and gives the safe control
// focus, which is the pattern the a11y reviewer required on journey delete.
// Neither is theatre: a 65+ member arriving here by mis-tap should have to work
// to destroy their account, and should be told plainly what is happening.
//
// The copy makes no promise this system cannot keep. There is no backup-purge
// automation, no SMTP, and no governance or treasury tables — so this screen
// says nothing about backups, sends no "we'll email you", and does NOT claim we
// retain anonymized participation records. On a deletion screen that last claim
// would be the worst kind of wrong: it would tell someone their data survives
// when it does not. Pinned by tests/components/DeleteAccountPanel.test.tsx.
export function DeleteAccountPanel({
  onExport,
  onDelete,
  onCancel,
  onFocusForTest,
}: DeleteAccountPanelProps) {
  const [typed, setTyped] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  /** Set when the member presses the destructive control before it is armed. */
  const [hint, setHint] = useState(false);

  const armed = matchesConfirmWord(typed);

  // One sentence, two platform carriers (accessibilityHint on native,
  // aria-describedby on web). Kept out of the live region on purpose.
  const preconditionText = armed
    ? "Ready. This deletes your account and cannot be undone."
    : "Type the word DELETE in the box above to turn this button on.";

  const cancelRef = useRef<View>(null);
  const triggerRef = useRef<View>(null);
  const fieldRef = useRef<TextInput>(null);
  const wasConfirming = useRef(false);
  useEffect(() => {
    // Focus lands on the SAFE control when the region opens, and returns to the
    // trigger when it closes. RNW exposes .focus() on focusable hosts; on native
    // it is a guarded no-op and the live region carries the announcement.
    if (confirming) {
      (cancelRef.current as { focus?: () => void } | null)?.focus?.();
      onFocusForTest?.("cancel");
    } else if (wasConfirming.current) {
      (triggerRef.current as { focus?: () => void } | null)?.focus?.();
      onFocusForTest?.("trigger");
    }
    wasConfirming.current = confirming;
  }, [confirming, onFocusForTest]);

  async function reallyDelete() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await onDelete();
    } catch {
      // Words, never a code or a raw message — the member cannot act on either.
      setFailed(true);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading} accessibilityRole="header" aria-level={1}>
        Delete your account and data
      </Text>
      <Text style={styles.lead}>This is permanent. We can&apos;t undo it.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>
          When you confirm, we delete
        </Text>
        {[
          "your account and sign-in",
          "your posts, comments, and upbeats",
          "your journey pages",
          "your diagnosis and symptom self-ID tags",
          "your consent records",
        ].map((line) => (
          <Text key={line} style={styles.bullet}>
            {`• ${line}`}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>
          How it works
        </Text>
        <Text style={styles.body}>
          Your data is removed from OneRhythm right away.
        </Text>
        <Text style={styles.body}>
          We can&apos;t send you a confirmation message yet. When you&apos;re
          signed out, it&apos;s done.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header" aria-level={2}>
          Want a copy first?
        </Text>
        <Text style={styles.body}>
          You can download everything we hold before you delete it.
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
      </View>

      <View style={styles.section}>
        <Text style={styles.fieldLabel} nativeID="confirm-label">
          Type DELETE to confirm
        </Text>
        <TextInput
          ref={fieldRef}
          value={typed}
          onChangeText={(next) => {
            setTyped(next);
            if (hint) setHint(false);
          }}
          accessibilityLabel="Type DELETE to confirm"
          aria-labelledby="confirm-label"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />
        <View
          testID="delete-status"
          accessibilityLiveRegion="polite"
          style={styles.statusRegion}
        >
          <Text style={styles.body}>
            {armed
              ? "Ready. Deleting your account cannot be undone."
              : hint
                ? "Type the word DELETE in the box above to turn the button on. Capital letters are not required."
                : "The delete button turns on once you type the word."}
          </Text>
        </View>
      </View>

      {failed ? (
        <Text style={styles.error} accessibilityRole="alert">
          {"We couldn't delete your account just now. Nothing was changed. Want to try again?"}
        </Text>
      ) : null}

      <View
        testID="delete-confirm"
        accessibilityLiveRegion="polite"
        style={confirming ? styles.confirmBox : null}
      >
        {confirming ? (
          <>
          <Text style={styles.confirmText}>
            Last check: this deletes your account and everything in it, for
            good.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Yes, delete my account"
            accessibilityState={{ busy }}
            onPress={reallyDelete}
            style={({ focused, pressed }: PressState) => [
              styles.destructiveButton,
              pressed && styles.pressed,
              focused && styles.focusRing,
            ]}
          >
            {busy ? (
              <ActivityIndicator color={tokens.ink} />
            ) : (
              <Text style={styles.destructiveText}>
                Yes, delete my account
              </Text>
            )}
          </Pressable>
          <Pressable
            ref={cancelRef}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={() => setConfirming(false)}
            style={({ focused, pressed }: PressState) => [
              styles.secondaryButton,
              pressed && styles.pressed,
              focused && styles.focusRing,
            ]}
          >
            <Text style={styles.secondaryText}>Cancel</Text>
          </Pressable>
          </>
        ) : null}
      </View>

      {confirming ? null : (
        <Pressable
          ref={triggerRef}
          accessibilityRole="button"
          accessibilityLabel="Permanently delete my account"
          // NOT aria-disabled, deliberately, and this is load-bearing on web.
          //
          // react-native-web renders accessibilityRole="button" as a real
          // <button>, and createDOMProps "enhances with native semantics": any
          // disabled state on a button/form/input/select/textarea becomes a real
          // `disabled` attribute alongside aria-disabled. A disabled <button> is
          // out of the Tab order whatever tabindex says, AND receives no click
          // events — so the hint branch below was dead on web for mouse and
          // keyboard alike. There is no way to get aria-disabled onto a
          // role="button" element in RNW without that attribute coming too.
          //
          // The ARIA is also simply wrong: aria-disabled means "perceivable but
          // not operable", and this control IS operable — pressing it before the
          // word is typed explains what to do and moves focus to the field. So
          // the state is carried in words instead. See ADR 0014.
          //
          // Two carriers, one per platform, because neither crosses over:
          // accessibilityHint is absent from react-native-web 0.21.2 entirely
          // (dropped in silence, exactly like the Android-only hiding prop in
          // src/lib/a11y.ts), and aria-describedby means nothing on native.
          //
          // The description target is deliberately NOT the live-region text
          // below. Pointing a description at a node inside aria-live makes the
          // same sentence arrive through two channels at two different times —
          // once when the region mutates, once when the button takes focus. The
          // a11y reviewer flagged that as a real double-announcement risk, so
          // the description lives on its own quiet node.
          accessibilityHint={preconditionText}
          aria-describedby="delete-precondition"
          onPress={() => {
            if (!armed) {
              // Send them where the answer is, rather than doing nothing.
              setHint(true);
              (fieldRef.current as { focus?: () => void } | null)?.focus?.();
              onFocusForTest?.("field");
              return;
            }
            setHint(false);
            setConfirming(true);
          }}
          style={({ focused, pressed }: PressState) => [
            styles.destructiveButton,
            // NOT opacity. `opacity: 0.5` composites the whole subtree toward
            // Paper, taking Pulse Red from 4.90:1 to 2.48:1 — below both the
            // 4.5:1 text bar (SC 1.4.3) and the 3:1 UI bar (SC 1.4.11). WCAG
            // excuses that only for INACTIVE components, and the entire point
            // of this control is that it stays active. So the unarmed state is
            // carried by the accent being withheld until the action is real:
            // Ink at 21:1 now, Pulse Red at 4.90:1 once armed. Both pass.
            !armed && styles.inertButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={[styles.destructiveText, !armed && styles.inertText]}>
            Permanently delete my account
          </Text>
        </Pressable>
      )}

      {/*
       * The quiet half of the state, for aria-describedby only. Clipped rather
       * than opacity:0 or display:none, both of which can drop a node out of
       * the accessibility tree and leave the reference dangling.
       */}
      {Platform.OS === "web" && !confirming ? (
        <Text nativeID="delete-precondition" style={styles.srOnly}>
          {preconditionText}
        </Text>
      ) : null}

      {confirming ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={onCancel}
          style={({ focused, pressed }: PressState) => [
            styles.secondaryButton,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.secondaryText}>Cancel</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  lead: {
    fontSize: 18,
    lineHeight: 28,
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
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  bullet: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  fieldLabel: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: tokens.ink,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: tokens.ink,
    backgroundColor: tokens.paper,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  statusRegion: { minHeight: 24 },
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
  error: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.pulse,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  pressed: { opacity: 0.85 },
  // Withhold the accent until the destructive action is actually available.
  // Ink on Paper is 21:1, so this state passes contrast outright — unlike the
  // opacity dimming it replaces, which measured 2.48:1. See ADR 0014.
  inertButton: { borderColor: tokens.ink },
  inertText: { color: tokens.ink },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    // See UpbeatButton: the typeface guard covers hidden text nodes too.
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  focusRing: {
    outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset,
  },
});
