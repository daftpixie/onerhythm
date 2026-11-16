import { type ComponentRef, useEffect, useId, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { type PressState } from "../../lib/pressable";
import { useAnnounce } from "../StatusRegion";
import { focusById, focusNode, isEscapeToHandle, type PanelKeyEvent } from "./panel";
import { mod } from "./styles";

// Block a member (ADR 0022, the inline panel contract; plan §4.8).
//
// One decision: Block or Cancel. No reason is asked, and there is never a
// CAPTCHA or "type to confirm" (SC 3.3.8). Three short lines say what happens,
// honestly: the blocked member gets no notice, but may notice. If blocking
// hides the post (and with it this opener), focus goes to the named fallback,
// never to body.

const LINES = [
  "You won't see their posts.",
  "They can't reply to you.",
  "We won't send them a notice, but they may notice they can't see your posts.",
];

export interface BlockControlProps {
  memberName: string;
  /** Where focus goes if this control disappears after blocking (the list heading or the next post). */
  fallbackFocusId: string;
  onBlock: () => Promise<void>;
}

export function BlockControl({ memberName, fallbackFocusId, onBlock }: BlockControlProps) {
  const announce = useAnnounce();
  const id = useId();
  const panelId = `block-panel-${id}`;
  const headingId = `block-heading-${id}`;
  const linesId = `block-lines-${id}`;

  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const openerRef = useRef<ComponentRef<typeof View>>(null);
  const headingRef = useRef<ComponentRef<typeof Text>>(null);
  const wasOpen = useRef(false);
  const blockedRef = useRef(false);

  useEffect(() => {
    if (open) focusNode(headingRef.current);
    else if (wasOpen.current) focusNode(openerRef.current);
    wasOpen.current = open;
  }, [open]);

  // Still here after blocking: focus returns to the opener (the effect above,
  // as the panel closes). Gone (the parent hid the post): focus the fallback.
  useEffect(
    () => () => {
      if (blockedRef.current) focusById(fallbackFocusId);
    },
    [fallbackFocusId],
  );

  async function block() {
    setFailed(false);
    // Set before awaiting: the parent may hide this control while onBlock
    // runs, and the unmount cleanup must already know where focus goes.
    blockedRef.current = true;
    try {
      await onBlock();
      setBlocked(true);
      setOpen(false);
      announce("Blocked.");
    } catch {
      blockedRef.current = false;
      setFailed(true);
    }
  }

  function onKeyDown(e: PanelKeyEvent) {
    if (isEscapeToHandle(e)) setOpen(false);
  }

  return (
    <View>
      <Pressable
        ref={openerRef}
        onPress={() => setOpen((o) => !o)}
        role="button"
        accessibilityRole="button"
        aria-label={blocked ? `Blocked ${memberName}` : `Block ${memberName}`}
        aria-expanded={open}
        aria-controls={panelId}
        style={({ focused, pressed }: PressState) => [
          mod.button,
          pressed && mod.pressed,
          focused && mod.focusRing,
        ]}
      >
        <Text style={mod.buttonText}>{blocked ? `Blocked ${memberName}` : `Block ${memberName}`}</Text>
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
            Block {memberName}?
          </Text>
          <View nativeID={linesId}>
            {LINES.map((line) => (
              <Text key={line} style={mod.body}>
                {line}
              </Text>
            ))}
          </View>
          {failed && (
            <Text role="alert" style={mod.error}>
              That didn&apos;t work. Please try again.
            </Text>
          )}
          <View style={mod.row}>
            <Pressable
              onPress={block}
              role="button"
              accessibilityRole="button"
              aria-describedby={linesId}
              style={({ focused, pressed }: PressState) => [
                mod.button,
                mod.buttonPrimary,
                pressed && mod.pressed,
                focused && mod.focusRing,
              ]}
            >
              <Text style={[mod.buttonText, mod.buttonTextPrimary]}>Block</Text>
            </Pressable>
            <Pressable
              onPress={() => setOpen(false)}
              role="button"
              accessibilityRole="button"
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
