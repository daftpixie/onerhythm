import { type ComponentRef, useEffect, useId, useRef, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { type PressState } from "../../lib/pressable";
import { useAnnounce } from "../StatusRegion";
import { focusNode } from "./panel";
import { clearAppealDrafts, getAppealDraft, setAppealDraft } from "../../lib/moderation/appealDrafts";
import { mod } from "./styles";

// "Ask us to look again" — the appeal page body (ADR 0022; plan §4.5).
//
// Its own page, so a long statement has a real heading, a back button and
// normal scrolling. The draft is kept IN MEMORY ONLY, for the app session,
// keyed by the action: it may hold health details, so it is never written to
// device storage or the server before the member sends it. Sign-out clears it
// (clearAppealDrafts), and the page says plainly that closing the app loses it.
//
// The copy reads the gates (ADR 0021): while G2 (the appeals panel) is unmet
// it promises no reviewer and no time.

const MAX = 1000;
const WARN_AT = 900;

// Re-exported here so callers that know the page can clear its drafts.
export { clearAppealDrafts };

export type GateStatus = "met" | "unmet";

export interface AppealFormProps {
  actionId: string;
  gates: { G1: GateStatus; G2: GateStatus };
  /**
   * 1 (default): a Tier 1 action, appealable to the panel (G2).
   * 3: a safety-floor action. Never put to a vote: a trained person takes a
   * second look, which is part of G1 (ADR 0021).
   */
  tier?: 1 | 3;
  onSubmit: (statement: string) => Promise<void>;
}

export function AppealForm({ actionId, gates, onSubmit, tier = 1 }: AppealFormProps) {
  const announce = useAnnounce();
  const id = useId();
  const errorId = `appeal-error-${id}`;
  const countId = `appeal-count-${id}`;
  const labelId = `appeal-label-${id}`;
  const [text, setText] = useState(() => getAppealDraft(actionId));
  const [empty, setEmpty] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState(false);
  const fieldRef = useRef<ComponentRef<typeof TextInput>>(null);
  const savedRef = useRef<ComponentRef<typeof Text>>(null);
  const warned = useRef<number | null>(null);

  useEffect(() => {
    if (sent) focusNode(savedRef.current);
  }, [sent]);

  // Keep the draft in memory as it is typed.
  useEffect(() => {
    setAppealDraft(actionId, text);
  }, [actionId, text]);

  // Warn politely at 90% and at the limit, once each time it is reached.
  useEffect(() => {
    const left = MAX - text.length;
    const level = text.length >= MAX ? MAX : text.length >= WARN_AT ? WARN_AT : null;
    if (level !== null && warned.current !== level) announce(`${left} characters left`);
    warned.current = level;
  }, [text, announce]);

  async function submit() {
    setFailed(false);
    if (!text.trim()) {
      setEmpty(true);
      focusNode(fieldRef.current);
      return;
    }
    try {
      await onSubmit(text);
      setAppealDraft(actionId, "");
      setText("");
      setSent(true);
      announce("Your request is saved.");
    } catch {
      setFailed(true);
    }
  }

  return (
    <View style={pageStyle}>
      <Text role="heading" aria-level={1} style={mod.heading}>
        Ask us to look again
      </Text>
      {tier === 3 ? (
        gates.G1 === "unmet" ? (
          <Text style={mod.body}>
            You can ask us to look at this again. We haven&apos;t set up this review
            yet, so we can&apos;t say when. Once you send it, your request is saved.
          </Text>
        ) : (
          <Text style={mod.body}>
            You can ask us to look at this again. A trained person takes a second
            look. Once you send it, your request is saved.
          </Text>
        )
      ) : gates.G2 === "unmet" ? (
        <Text style={mod.body}>
          You can ask us to look at this again. We haven&apos;t set up our review panel
          yet, so we can&apos;t say when. Once you send it, your request is saved.
        </Text>
      ) : (
        <Text style={mod.body}>
          You can ask us to look at this again. Your request goes to our review
          panel. Once you send it, your request is saved.
        </Text>
      )}
      <Text style={mod.hint}>If you close the app, this draft is lost.</Text>

      {sent ? (
        <Text
          ref={savedRef}
          style={mod.body}
          // Focus moves here after Send, so it never falls to body (ADR 0022).
          {...({ tabIndex: -1 } as object)}
        >
          Your request is saved.
        </Text>
      ) : (
        <>
          {/* A visible label, named by id (never a placeholder or an
              aria-label alone). iOS has no labelled-by, so it gets the same
              words as its label. */}
          <Text nativeID={labelId} style={mod.label}>
            What should we know?
          </Text>
          <TextInput
            ref={fieldRef}
            value={text}
            onChangeText={(t) => {
              setText(t.slice(0, MAX));
              if (t.trim()) setEmpty(false);
            }}
            multiline
            maxLength={MAX}
            aria-labelledby={labelId}
            accessibilityLabelledBy={labelId}
            accessibilityLabel={Platform.OS === "ios" ? "What should we know?" : undefined}
            aria-invalid={empty ? true : undefined}
            aria-describedby={empty ? `${errorId} ${countId}` : countId}
            style={mod.input}
          />
          {empty && (
            <Text nativeID={errorId} style={mod.error}>
              Please tell us what to look at again.
            </Text>
          )}
          <Text nativeID={countId} style={mod.hint}>
            {MAX - text.length} characters left
          </Text>
          {failed && (
            <Text role="alert" style={mod.error}>
              Your request didn&apos;t send. Please try again.
            </Text>
          )}
          <Pressable
            onPress={submit}
            role="button"
            accessibilityRole="button"
            style={({ focused, pressed }: PressState) => [
              mod.button,
              mod.buttonPrimary,
              pressed && mod.pressed,
              focused && mod.focusRing,
            ]}
          >
            <Text style={[mod.buttonText, mod.buttonTextPrimary]}>Send</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const pageStyle = { padding: 16 };
