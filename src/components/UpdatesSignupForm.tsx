import { useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { hiddenFromAssistiveTech } from "../lib/a11y";
import { type PressState } from "../lib/pressable";
import { looksLikeEmail, subscribeToUpdates } from "../lib/updates/subscribe";
import { tokens, radius, focus } from "../theme/tokens";

// The pre-launch updates form. It collects an email address and NOTHING else —
// no name, no role, and above all nothing about anyone's health (CLAUDE.md #1).
//
// Brand v3 §7 inputs: label ABOVE the field, never placeholder-as-label; Ink 4%
// fill, 1px Ink border, 8px radius; errors show an icon AND words below the
// field, never colour alone (SC 1.4.1 / 3.3.1).
// Said in one piece, and said honestly: no confirmation email exists yet
// because there is no mail system yet (ADR 0011 decision b). The page must not
// tell anyone to check an inbox that will stay empty.
const SUCCESS_MESSAGE =
  "Thanks — we've saved your address. Nothing is sent yet: we haven't set up " +
  "our mail system, so no email has gone out and none is on its way. When " +
  "updates start, we'll write to you once to check the address is really " +
  "yours, and you'll only be on the list after you say yes.";

// The label lives in one place. It is rendered as visible text AND handed to
// the field as accessibilityLabel, because aria-labelledby is web+Android only
// (RN marks accessibilityLabelledBy @platform android) — on iOS the field is
// named solely by this string. One constant so the two cannot drift apart.
const EMAIL_LABEL = "Your email address";

const FAILED_MESSAGE =
  "Sorry — we couldn't save that just now. Please try again.";

const EMAIL_ERROR =
  "That doesn't look like an email address. Please check it and try again.";

// accessibilityLiveRegion (and aria-live) are @platform android in this React
// Native version, and role="alert"/"status" does not make VoiceOver speak on
// its own — an iOS screen-reader user would otherwise submit this form and
// hear nothing at all. So iOS gets an explicit announcement and the other two
// platforms keep the live-region props; announcing on all three would make
// TalkBack say everything twice.
//
// Called at the point the outcome is known rather than from an effect keyed on
// the message, because submitting the same bad address twice sets the same
// string, React bails out of the identical state update, and the second
// failure would never be announced.
function announce(message: string) {
  if (Platform.OS === "ios") {
    AccessibilityInfo.announceForAccessibility(message);
  }
}

export function UpdatesSignupForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit() {
    const trimmed = email.trim();
    if (!looksLikeEmail(trimmed)) {
      setError(EMAIL_ERROR);
      announce(EMAIL_ERROR);
      return;
    }

    setError(null);
    setSubmitting(true);
    const result = await subscribeToUpdates(trimmed);
    setSubmitting(false);

    if (result.ok) {
      // The same message whether the address was new or already on the list.
      // The database absorbs duplicates silently; saying "you're already on
      // the list" here would hand back exactly the answer that design exists
      // to withhold.
      setDone(true);
      announce(SUCCESS_MESSAGE);
      return;
    }
    if (result.reason === "invalid_email") {
      setError(EMAIL_ERROR);
      announce(EMAIL_ERROR);
      return;
    }
    setError(FAILED_MESSAGE);
    announce(FAILED_MESSAGE);
  }

  return (
    <View style={styles.form}>
      {/* The live region is mounted from the start and only its TEXT changes.
          A region that appears at the same moment its content does is
          unreliable — assistive tech may never see the change. One Text, one
          string: splitting a message across sibling nodes is how a screen
          reader ends up reading half of it. */}
      <View style={done ? styles.successBox : styles.regionIdle}>
        <Text
          style={styles.successBody}
          role="status"
          accessibilityLiveRegion="polite"
        >
          {done ? SUCCESS_MESSAGE : ""}
        </Text>
      </View>

      {done ? null : (
        <>
          <Text nativeID="updates-email-label" style={styles.label}>
            {EMAIL_LABEL}
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            // The visible <Text> above is the label; this names the field for
            // assistive tech without a placeholder that vanishes on focus.
            accessibilityLabel={EMAIL_LABEL}
            aria-labelledby="updates-email-label"
            // There is no native equivalent of aria-describedby, and React
            // Native's AccessibilityState has no `invalid` key, so on iOS and
            // Android the error is folded into the hint instead. Otherwise
            // someone who tabs back into the field after a rejected address
            // hears only "Your email address, edit text" and no reason why.
            accessibilityHint={
              error
                ? `Error: ${error}`
                : "We'll only use this to email you about the project."
            }
            aria-invalid={!!error}
            aria-describedby={error ? "updates-email-error" : undefined}
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            inputMode="email"
            editable={!submitting}
            onSubmitEditing={onSubmit}
            returnKeyType="go"
            style={styles.input}
          />

          {error ? (
            <View style={styles.errorRow}>
              {/* Icon AND words. The icon alone would fail 1.4.1 for a reader who
              cannot distinguish the accent; the words alone are easy to miss.
              The icon is hidden from assistive tech so the announcement is the
              sentence, not "exclamation mark".

              Hidden through the platform helper, which picks exactly ONE
              spelling. This previously passed the Android-only prop (silently
              dropped by RNW's Text allowlist on web) alongside `aria-hidden`,
              which left the glyph UNHIDDEN on iOS — the error would have
              announced "exclamation mark" ahead of the sentence there. The
              icon is a SIBLING of the message, not nested inside it, so the
              helper is the right tool here rather than a label on the parent. */}
              <Text style={styles.errorIcon} {...hiddenFromAssistiveTech()}>
                !
              </Text>
              <Text
                nativeID="updates-email-error"
                style={styles.errorText}
                accessibilityRole="alert"
                role="alert"
                accessibilityLiveRegion="assertive"
              >
                {error}
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={submitting ? "Saving…" : "Keep me posted"}
            accessibilityState={{ disabled: submitting }}
            disabled={submitting}
            onPress={onSubmit}
            style={({ focused, pressed }: PressState) => [
              styles.submit,
              pressed && styles.submitPressed,
              focused && styles.focusRing,
            ]}
          >
            <Text style={styles.submitText}>
              {submitting ? "Saving…" : "Keep me posted"}
            </Text>
          </Pressable>

          <Text style={styles.fineprint}>
            We’ll only email you about the project — how it’s going and when it
            opens. We never sell or share your address, and you can unsubscribe
            from any email with one click.
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
    maxWidth: 480,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: tokens.ink,
    borderRadius: radius.input,
    backgroundColor: tokens.fill,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 18,
    lineHeight: 27,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
  },
  errorIcon: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: tokens.pulse,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  errorText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  submit: {
    marginTop: 16,
    minHeight: 44,
    minWidth: 44,
    alignSelf: "flex-start",
    backgroundColor: tokens.pulse,
    borderRadius: radius.input,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitPressed: {
    opacity: 0.85,
  },
  focusRing: {
    outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset,
  },
  submitText: {
    color: tokens.paper,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  fineprint: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  // Collapsed, but mounted: the live region exists before it has anything to
  // say. Not `display: none` — a hidden region is not announced.
  regionIdle: {
    height: 0,
    overflow: "hidden",
  },
  successBox: {
    width: "100%",
    maxWidth: 480,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: radius.card,
    backgroundColor: tokens.fill,
    padding: 24,
  },
  successBody: {
    fontSize: 18,
    lineHeight: 27,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
});
