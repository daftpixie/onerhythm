import { type ComponentRef, useEffect, useId, useRef, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { type PressState } from "../../lib/pressable";
import { useAnnounce } from "../StatusRegion";
import { CrisisLinks } from "./CrisisLinks";
import { mod } from "./styles";
import { focusNode, isEscapeToHandle, type PanelKeyEvent } from "./panel";

// Report a post or comment (ADR 0022, the inline panel contract; plan §4.8).
//
// An inline panel under the post, never a modal, so the header's "Need help
// right now?" stays reachable. Focus goes to the panel heading on open and
// back to the opener on Escape, Cancel or a successful Send. The chosen reason
// and the note survive an accidental close (SC 3.3.7) and are cleared only by
// a successful Send. Copy promises no reviewer or time (ADR 0021, T8).

export type ReportReason =
  | "self_harm"
  | "dangerous_misinfo"
  | "harassment"
  | "spam_or_scam"
  | "other_safety"
  | "off_topic"
  | "unkind";

/** Safety reasons first, then Tier 1 reasons (plan §4.8). Labels say what, plainly. */
const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "self_harm", label: "Someone may be in danger of hurting themselves" },
  { value: "dangerous_misinfo", label: "A health claim that could hurt someone" },
  { value: "harassment", label: "Bullying, threats or sharing someone's private details" },
  { value: "spam_or_scam", label: "Spam or a scam" },
  { value: "other_safety", label: "Something else unsafe" },
  { value: "off_topic", label: "Off topic" },
  { value: "unkind", label: "Unkind" },
];

export interface ReportControlProps {
  subjectKind: "post" | "comment";
  authorName: string;
  onSubmit: (report: { reason: ReportReason; note: string }) => Promise<void>;
  /** G1 (crisis response and review staffing). Unmet unless the caller knows otherwise. */
  reviewGate?: "met" | "unmet";
}

export function ReportControl({
  subjectKind,
  authorName,
  onSubmit,
  reviewGate = "unmet",
}: ReportControlProps) {
  const announce = useAnnounce();
  const id = useId();
  const panelId = `report-panel-${id}`;
  const headingId = `report-heading-${id}`;
  const legendId = `report-legend-${id}`;
  const errorId = `report-error-${id}`;
  const hintId = `report-hint-${id}`;
  const noteLabelId = `report-note-label-${id}`;

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [noReason, setNoReason] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const openerRef = useRef<ComponentRef<typeof View>>(null);
  const headingRef = useRef<ComponentRef<typeof Text>>(null);
  const firstRadioRef = useRef<ComponentRef<typeof View>>(null);
  const wasOpen = useRef(false);

  // Focus in on open; focus back to the opener on close.
  useEffect(() => {
    if (open) focusNode(headingRef.current);
    else if (wasOpen.current) focusNode(openerRef.current);
    wasOpen.current = open;
  }, [open]);

  function close() {
    setOpen(false);
  }

  function onKeyDown(e: PanelKeyEvent) {
    if (isEscapeToHandle(e)) close();
  }

  async function send() {
    if (busy) return;
    if (!reason) {
      setNoReason(true);
      focusNode(firstRadioRef.current);
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      await onSubmit({ reason, note });
      setReason(null);
      setNote("");
      setNoReason(false);
      setOpen(false);
      announce("Thanks. We saved your report.");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      <Pressable
        ref={openerRef}
        onPress={() => setOpen((o) => !o)}
        role="button"
        accessibilityRole="button"
        aria-label={`Report this ${subjectKind} by ${authorName}`}
        aria-expanded={open}
        aria-controls={panelId}
        style={({ focused, pressed }: PressState) => [
          mod.button,
          pressed && mod.pressed,
          focused && mod.focusRing,
        ]}
      >
        <Text style={mod.buttonText}>⚑ Report</Text>
      </Pressable>

      {open && (
        <View
          nativeID={panelId}
          role="group"
          aria-labelledby={headingId}
          style={mod.panel}
          {...({ onKeyDown } as object)}
        >
          <Text
            ref={headingRef}
            nativeID={headingId}
            role="heading"
            aria-level={2}
            style={mod.heading}
            {...({ tabIndex: -1 } as object)}
          >
            Report this {subjectKind}
          </Text>

          <Text nativeID={legendId} style={mod.body}>
            Why are you reporting this?
          </Text>
          <View
            role="radiogroup"
            aria-labelledby={legendId}
            aria-invalid={noReason ? true : undefined}
            aria-describedby={noReason ? errorId : undefined}
          >
            {REASONS.map((r, i) => {
              const checked = reason === r.value;
              return (
                <View key={r.value}>
                  <Pressable
                    ref={i === 0 ? firstRadioRef : undefined}
                    onPress={() => {
                      setReason(r.value);
                      setNoReason(false);
                    }}
                    role="radio"
                    accessibilityRole="radio"
                    aria-checked={checked}
                    aria-label={r.label}
                    style={({ focused, pressed }: PressState) => [
                      radio.row,
                      pressed && mod.pressed,
                      focused && mod.focusRing,
                    ]}
                  >
                    <Text style={mod.body} aria-hidden>
                      {checked ? "◉" : "○"} {r.label}
                    </Text>
                  </Pressable>
                  {/* Copy that names self-harm keeps the crisis resources in
                      the same block (plan §5.1, crisis adjacency). */}
                  {r.value === "self_harm" && (
                    <View style={radio.adjacent}>
                      <Text style={mod.hint}>
                        If someone is in danger right now, in the US call or text
                        988, or call your local emergency number.
                      </Text>
                      <CrisisLinks which={["call988", "text988", "emergency"]} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          {noReason && (
            <Text nativeID={errorId} style={mod.error}>
              Choose a reason to send your report.
            </Text>
          )}

          {/* Honest about G1: no review team yet, so no promise (ADR 0021). */}
          <Text style={mod.body}>
            {reviewGate === "met"
              ? "We save every report, and a trained person reviews it."
              : "We save every report. We haven't set up our review team yet, so we can't say when someone will look at it."}
          </Text>

          {/* A visible label, named by id (never a placeholder or an
              aria-label alone). iOS has no labelled-by, so it gets the same
              words as its label. */}
          <Text nativeID={noteLabelId} style={mod.label}>
            Anything else? (optional)
          </Text>
          <Text nativeID={hintId} style={mod.hint}>
            Please don&apos;t include health details or anyone&apos;s name.
          </Text>
          <TextInput
            value={note}
            onChangeText={(t) => setNote(t.slice(0, 500))}
            multiline
            maxLength={500}
            aria-labelledby={noteLabelId}
            accessibilityLabelledBy={noteLabelId}
            accessibilityLabel={Platform.OS === "ios" ? "Anything else? (optional)" : undefined}
            aria-describedby={hintId}
            // react-native-web's TextInput stops keydown from bubbling to the
            // panel, but passes it to onKeyPress first.
            onKeyPress={(e) => onKeyDown(e as unknown as PanelKeyEvent)}
            style={mod.input}
          />

          {failed && (
            <Text role="alert" style={mod.error}>
              Your report didn&apos;t send. Please try again.
            </Text>
          )}

          <View style={mod.row}>
            <Pressable
              onPress={send}
              role="button"
              accessibilityRole="button"
              aria-label="Send report"
              style={({ focused, pressed }: PressState) => [
                mod.button,
                mod.buttonPrimary,
                pressed && mod.pressed,
                focused && mod.focusRing,
              ]}
            >
              <Text style={[mod.buttonText, mod.buttonTextPrimary]}>Send report</Text>
            </Pressable>
            <Pressable
              onPress={close}
              role="button"
              accessibilityRole="button"
              aria-label="Cancel"
              style={({ focused, pressed }: PressState) => [
                mod.button,
                pressed && mod.pressed,
                focused && mod.focusRing,
              ]}
            >
              <Text style={mod.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const radio = {
  row: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center" as const,
    paddingVertical: 4,
  },
  adjacent: { marginLeft: 24, marginBottom: 8 },
};
