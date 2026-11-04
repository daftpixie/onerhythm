import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { tokens } from "../theme/tokens";

// One polite status region for the whole app (ADR 0022; plan §5.3; SC 4.1.3).
//
// StatusRegionProvider (at the app root) holds the message; AppShell renders
// the region in its footer, so it sits inside a landmark and exists before
// anything is announced. Components announce through useAnnounce().
//
// useAnnounce empties the region at once and sets the new text a short moment
// later. React would merge a clear and a set in the same tick into one change,
// and the same message twice would then be read only once.
export const CLEAR_THEN_SET_MS = 100;

interface StatusRegionState {
  message: string;
  announce: (message: string) => void;
}

const noop = () => {};
const StatusRegionContext = createContext<StatusRegionState>({
  message: "",
  announce: noop,
});

export function StatusRegionProvider({
  children,
  resetKey,
}: {
  children: ReactNode;
  /**
   * The current screen (the root layout passes the path). When it changes,
   * a message left from the last screen is cleared, and one still waiting to
   * be set is dropped, so nothing stale is read on the new screen.
   */
  resetKey?: string;
}) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKey = useRef(resetKey);

  useEffect(() => {
    if (lastKey.current === resetKey) return;
    lastKey.current = resetKey;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setMessage("");
  }, [resetKey]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const announce = useCallback((next: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage("");
    timer.current = setTimeout(() => setMessage(next), CLEAR_THEN_SET_MS);
  }, []);

  return (
    <StatusRegionContext.Provider value={{ message, announce }}>
      {children}
    </StatusRegionContext.Provider>
  );
}

/** Announce a short status message. A no-op outside a StatusRegionProvider. */
export function useAnnounce(): (message: string) => void {
  return useContext(StatusRegionContext).announce;
}

/** The region itself. AppShell renders exactly one, in its footer. */
export function StatusRegion() {
  const { message } = useContext(StatusRegionContext);
  return (
    <View
      testID="app-status-region"
      role="status"
      aria-live="polite"
      accessibilityLiveRegion="polite"
    >
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
});
