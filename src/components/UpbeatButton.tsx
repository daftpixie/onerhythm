import { useEffect, useId, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type PressState } from "../lib/pressable";
import { tokens, focus } from "../theme/tokens";

export interface UpbeatButtonProps {
  count: number;
  upbeated: boolean;
  /** Called with the desired next presence; reject to roll the UI back. */
  onToggle: (next: boolean) => Promise<unknown>;
  /** Accessible subject, e.g. "this post" or "comment by Rosa". */
  subjectLabel: string;
}

// The ♥ Upbeat control (Brand v3 §7): a SINGLE positive presence/absence
// toggle. Filled heart = you've upbeated; outline = you haven't. There is
// structurally no negative counterpart — removing an upbeat deletes the row.
// Optimistic UI with rollback: the press flips the display immediately; a
// rejected toggle restores the snapshot and says so in plain words.
export function UpbeatButton({
  count,
  upbeated,
  onToggle,
  subjectLabel,
}: UpbeatButtonProps) {
  const [optimistic, setOptimistic] = useState<{
    upbeated: boolean;
    count: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // Fresh props (a refetch) supersede any optimistic state.
  useEffect(() => {
    setOptimistic(null);
  }, [count, upbeated]);

  const shown = optimistic ?? { upbeated, count };

  // A feed renders many of these, so the description id must be per-instance —
  // duplicate ids would make every button describe the first one's count.
  const countId = `upbeat-count-${useId()}`;
  const countLabel = `${shown.count} ${shown.count === 1 ? "upbeat" : "upbeats"}`;

  async function press() {
    if (busy) return;
    const snapshot = shown;
    const next = !shown.upbeated;
    setOptimistic({
      upbeated: next,
      count: Math.max(0, snapshot.count + (next ? 1 : -1)),
    });
    setFailed(false);
    setBusy(true);
    try {
      await onToggle(next);
    } catch {
      setOptimistic(snapshot);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Upbeat ${subjectLabel}`}
        // RN core's accessibilityState supports `selected` (not `pressed`) —
        // the RN toggle idiom. On web, RNW gets the true ARIA toggle-button
        // semantics via the aria-pressed passthrough.
        accessibilityState={{ selected: shown.upbeated, busy }}
        aria-pressed={shown.upbeated}
        // The tally, in plain words, one carrier per platform.
        //
        // An explicit accessibilityLabel OVERRIDES the text content for the
        // accessible name, so a screen-reader user heard "Upbeat this post,
        // button, pressed" and never heard the count — even though it is drawn
        // right there. The name must stay stable (a toggle button's name should
        // not change with its state), so the count belongs in a DESCRIPTION.
        //
        // NOT aria-valuenow: that belongs to range widgets (slider, spinbutton,
        // progressbar, scrollbar) and assistive tech ignores it on a button. RNW
        // also drops RN's accessibilityValue={{now}} object form entirely — it
        // only reads aria-valuenow / accessibilityValueNow. See ADR 0014.
        accessibilityValue={{ now: shown.count, min: 0, text: countLabel }}
        aria-describedby={countId}
        onPress={press}
        style={({ focused, pressed }: PressState) => [
          styles.button,
          shown.upbeated && styles.buttonOn,
          pressed && styles.pressed,
          focused && styles.focusRing,
        ]}
      >
        {/*
         * State is carried in WORDS, not only by the ♥/♡ swap. A 16px glyph
         * difference satisfies SC 1.4.1 to the letter but is thin for the 65+
         * low-vision reader this platform is built for, and this is the
         * signature control. The accessible NAME deliberately stays
         * "Upbeat {subject}" in both states — a toggle button's name should be
         * stable while aria-pressed carries the state — so this text is the
         * SIGHTED reader's carrier, and only theirs.
         */}
        <Text style={[styles.text, shown.upbeated && styles.textOn]}>
          {shown.upbeated ? "♥ You upbeated" : "♡ Upbeat"} · {shown.count}
        </Text>
      </Pressable>
      {/*
       * The description target. Clipped rather than opacity:0 or display:none,
       * both of which can drop a node out of the accessibility tree and leave
       * aria-describedby pointing at nothing. Plain words, so it reads as
       * "3 upbeats" rather than "black heart, middle dot, 3".
       */}
      <Text nativeID={countId} style={styles.srOnly}>
        {countLabel}
      </Text>
      {failed ? (
        <Text style={styles.error} accessibilityRole="alert">
          {"We couldn't save that. Want to try again?"}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "flex-start" },
  // fontFamily is required even though this is never seen: the typeface guard
  // (v3 §10.1) forbids ANY text node falling back to the platform default, and
  // it was repaired precisely so that nodes with no declared family stop being
  // skipped. A hidden node is still a text node.
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
  // v3 §7: filled Pulse Red heart = you've upbeated; Ink outline = you haven't.
  // State is carried by the GLYPH (♥ vs ♡), by aria-pressed, and by
  // accessibilityState.selected — colour only ever reinforces it. The v2 pink
  // wash is retired: v3 §3 forbids Pulse Red as a background.
  button: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.ink,
    backgroundColor: tokens.paper,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonOn: {
    borderColor: tokens.pulse,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  textOn: {
    color: tokens.pulse,
  },
  error: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.pulse,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginTop: 4,
  },
  pressed: { opacity: 0.85 },
  focusRing: { outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset },
});
