import { useMemo } from "react";
import { AccessibilityInfo, Platform } from "react-native";

// The inline panel contract's small helpers (ADR 0022).

/** A keydown event as react-native-web passes it to onKeyDown. */
export interface PanelKeyEvent {
  key?: string;
  nativeEvent?: { key?: string; isComposing?: boolean };
  defaultPrevented?: boolean;
  isDefaultPrevented?: () => boolean;
}

/**
 * True for an Escape this panel should act on: on keydown only (the caller
 * wires it to onKeyDown, never a document listener), not while text is being
 * composed (an IME), and not if another handler already used it. So the
 * Escape that closes the crisis sheet never closes a panel too.
 */
export function isEscapeToHandle(e: PanelKeyEvent): boolean {
  const key = e.key ?? e.nativeEvent?.key;
  if (key !== "Escape") return false;
  if (e.nativeEvent?.isComposing) return false;
  const used = e.isDefaultPrevented ? e.isDefaultPrevented() : e.defaultPrevented;
  return !used;
}

type A11yNode = Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0];

/**
 * Move focus to a host node. Web: DOM focus. Native (iOS and Android): the
 * screen-reader "focus" event, as the crisis sheet does. A guarded no-op if
 * the node is gone. The manual VoiceOver/TalkBack pass (G7) confirms it.
 */
export function focusNode(node: unknown) {
  if (!node) return;
  if (Platform.OS === "web") (node as { focus?: () => void }).focus?.();
  else AccessibilityInfo.sendAccessibilityEvent(node as A11yNode, "focus");
}

// Named focus targets, for native, where there are no DOM ids. A fallback
// (the list heading, the next post) registers under the same id it carries
// as nativeID on the web, so focusById works on both.
const targets = new Map<string, unknown>();
const targetRefs = new Map<string, (node: unknown) => void>();

/**
 * A callback ref that registers a node as the focus target `id`. One stable
 * function per id, so it can be used inside render helpers as well as hooks.
 */
export function focusTargetRef(id: string): (node: unknown) => void {
  let ref = targetRefs.get(id);
  if (!ref) {
    ref = (node: unknown) => {
      if (node) {
        targets.set(id, node);
      } else {
        // Forget the id with its node, so the maps never grow without end.
        targets.delete(id);
        targetRefs.delete(id);
      }
    };
    targetRefs.set(id, ref);
  }
  return ref;
}

/** focusTargetRef for components. */
export function useFocusTarget(id: string): (node: unknown) => void {
  return useMemo(() => focusTargetRef(id), [id]);
}

/**
 * Focus a named target. Web: the element with that DOM id. Native: the node
 * registered under it with focusTargetRef. Returns false if it isn't there.
 */
export function focusById(id: string): boolean {
  if (Platform.OS !== "web") {
    const node = targets.get(id);
    if (!node) return false;
    focusNode(node);
    return true;
  }
  if (typeof document === "undefined") return false;
  const el = document.getElementById(id);
  if (!el) return false;
  el.focus();
  return document.activeElement === el;
}
