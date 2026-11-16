import { type ComponentRef, Component, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  Linking,
  StyleSheet,
} from "react-native";
import { type PressState } from "../lib/pressable";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { tokens, focus } from "../theme/tokens";

// The crisis numbers. The component has no region detection, so these are the
// US numbers, and every label says so beside the "local emergency number" line.
// Pinned by tests/shared/contracts/crisis-help-sheet.ts.
const EMERGENCY = { label: "Call 911 (US)", url: "tel:911" };
const LIFELINE_CALL = { label: "Call 988", url: "tel:988" };
const LIFELINE_TEXT = { label: "Text 988", url: "sms:988" };
const RESOURCES = {
  label: "See mental-health crisis resources",
  url: "https://988lifeline.org/",
};

/**
 * Move focus to `node`. Web: DOM focus (react-native-web hosts expose
 * .focus()). Native: a screen-reader focus event. A guarded no-op if the node
 * is gone. The manual VoiceOver/TalkBack pass is still an open gate (G7).
 */
function moveFocus(node: unknown) {
  if (!node) return;
  if (Platform.OS === "web") {
    (node as { focus?: () => void }).focus?.();
  } else {
    AccessibilityInfo.sendAccessibilityEvent(
      node as Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0],
      "focus",
    );
  }
}

/** Shown when the device cannot open a crisis link. Never fail in silence. */
const OPEN_FAILED =
  "Your device couldn't open that. Dial 911 in the US or your local " +
  "emergency number. For the Suicide & Crisis Lifeline, call or text 988.";

/** A tap-to-act crisis action: visible text label = accessible name, 44px. */
function CrisisAction({
  label,
  url,
  onFailed,
}: {
  label: string;
  url: string;
  onFailed: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Linking.openURL(url).catch(onFailed);
      }}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ focused, pressed }: PressState) => [
        styles.action,
        pressed && styles.pressed,
        focused && styles.focusRing,
      ]}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

export function CrisisHelpSheet() {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();
  const titleId = `crisis-help-title-${useId()}`;
  const triggerRef = useRef<ComponentRef<typeof View>>(null);
  const titleRef = useRef<ComponentRef<typeof Text>>(null);
  const wasVisible = useRef(false);
  const [openFailed, setOpenFailed] = useState(false);
  const onFailed = () => setOpenFailed(true);

  // Focus goes to the TITLE on open, not to a call action, so a repeated
  // Enter or tap can never place a call by accident; the dialog's name is read
  // first. It returns to the trigger on close (button, Escape or back): on
  // native here, and on web in onDismiss below, because react-native-web's
  // focus trap stays active until the slide-out ends and would pull focus
  // straight back into the closing sheet.
  useEffect(() => {
    if (visible) {
      setOpenFailed(false);
      moveFocus(titleRef.current);
    } else if (wasVisible.current && Platform.OS !== "web") {
      moveFocus(triggerRef.current);
    }
    wasVisible.current = visible;
  }, [visible]);

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Need help right now?"
        style={({ focused, pressed }: PressState) => [
          styles.trigger,
          pressed && styles.pressed,
          focused && styles.focusRing,
        ]}
      >
        <Text style={styles.triggerIcon}>🆘</Text>
        <Text style={styles.triggerLabel}>Need help right now?</Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType={reduceMotion ? "none" : "slide"}
        transparent
        onRequestClose={() => setVisible(false)}
        onDismiss={() => {
          if (Platform.OS === "web") moveFocus(triggerRef.current);
        }}
        // react-native-web spreads this onto its role="dialog" element, so the
        // dialog is named by the title (without the glyph). Native ignores it.
        {...({ "aria-labelledby": titleId } as object)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet} accessibilityViewIsModal>
            {/* Scrolls, so large text or a small screen cannot push an
                action or Close out of reach. */}
            <ScrollView>
            {/*
             * The emoji stays VISIBLE — a11y.md requires icon AND text — but it
             * must not be spoken, or the title announces "SOS Need help right
             * now?". An explicit label on the PARENT is the only way that holds
             * on all three platforms: hiding a nested <Text> is inert on iOS,
             * where nested Text collapses into one attributed string and the
             * inner element's a11y props are dropped. This is the same
             * mechanism the trigger above already relies on.
             */}
            <Text
              ref={titleRef}
              nativeID={titleId}
              style={styles.sheetTitle}
              accessibilityLabel="Need help right now?"
              // Focusable by script only, so it can take focus on open.
              {...({ tabIndex: -1 } as object)}
            >
              🆘 Need help right now?
            </Text>

            <View style={styles.block}>
              <Text style={styles.sheetBody}>
                If this is a medical emergency, call your local emergency number
                now.
              </Text>
              <CrisisAction {...EMERGENCY} onFailed={onFailed} />
            </View>

            {/* Always mounted, so the message is announced when it appears.
                Near the top, so a sighted member sees it after a tap. */}
            <View role="status" accessibilityLiveRegion="polite">
              {openFailed && <Text style={styles.sheetBody}>{OPEN_FAILED}</Text>}
            </View>

            <Text style={styles.sheetBody}>Feeling in crisis or unsafe?</Text>

            {/*
             * Copy that names suicide keeps its call and text actions in the
             * SAME block (plan §5.1, crisis adjacency).
             */}
            <View style={styles.block}>
              <Text style={styles.sheetBody}>
                In the US, call or text 988 for the Suicide &amp; Crisis Lifeline.
              </Text>
              <CrisisAction {...LIFELINE_CALL} onFailed={onFailed} />
              <CrisisAction {...LIFELINE_TEXT} onFailed={onFailed} />
              <CrisisAction {...RESOURCES} onFailed={onFailed} />
            </View>

            <Text style={styles.sheetDisclaimer}>
              This community is peer support — not a substitute for professional
              care.
            </Text>

            <Pressable
              onPress={() => setVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ focused, pressed }: PressState) => [
                styles.closeButton,
                pressed && styles.pressed,
                focused && styles.focusRing,
              ]}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

/**
 * Shown if the sheet cannot render. Plain text and plain links, no Modal, so a
 * render failure never takes the crisis numbers away. A silent failure here is
 * a safety incident (a11y.md), not a UI bug.
 */
export function CrisisHelpFallback() {
  return (
    <View style={styles.fallback}>
      <Text style={styles.sheetBody}>
        Need help right now? In an emergency, call 911 in the US or your local
        emergency number. In the US, call or text 988 for the Suicide &amp;
        Crisis Lifeline.
      </Text>
      {[EMERGENCY, LIFELINE_CALL, LIFELINE_TEXT].map((a) => (
        <Pressable
          key={a.url}
          // No state here on purpose: the fallback must not be able to fail.
          // The numbers are in its visible text, so a device with no phone
          // handler still shows what to dial.
          onPress={() => {
            Linking.openURL(a.url).catch(() => {});
          }}
          accessibilityRole="link"
          accessibilityLabel={a.label}
          style={({ focused }: PressState) => [
            styles.action,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.actionText}>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Catches a render failure in the crisis sheet and shows the fallback. */
export class CrisisHelpBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <CrisisHelpFallback /> : this.props.children;
  }
}

/** The crisis control as every screen should mount it: sheet + fallback. */
export function CrisisHelp() {
  return (
    <CrisisHelpBoundary>
      <CrisisHelpSheet />
    </CrisisHelpBoundary>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  triggerIcon: {
    fontSize: 18,
    lineHeight: 27,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginRight: 6,
  },
  triggerLabel: {
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
  overlay: {
    flex: 1,
    backgroundColor: tokens.scrim,
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "100%",
    backgroundColor: tokens.paper,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontSize: 22,
    lineHeight: 33,
    fontWeight: "700",
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginBottom: 16,
  },
  sheetBody: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginBottom: 12,
  },
  block: {
    marginBottom: 12,
  },
  fallback: {
    paddingVertical: 8,
  },
  action: {
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontWeight: "600",
    fontFamily: "AtkinsonHyperlegible_700Bold",
    textDecorationLine: "underline",
  },
  sheetDisclaimer: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginBottom: 20,
  },
  closeButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.fill,
    borderRadius: 8,
    paddingVertical: 12,
  },
  closeText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
});
