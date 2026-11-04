import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CrisisHelp } from "./CrisisHelpSheet";
import { ContactLink } from "./ContactLink";
import { StatusRegion } from "./StatusRegion";
import { Wordmark } from "./Wordmark";
import { tokens } from "../theme/tokens";

interface AppShellProps {
  children: ReactNode;
}

/** The id of the page's one main landmark; a skip link points here. */
export const MAIN_ID = "main-content";

// A page that has its own navigation (the moderator console's skip link and
// menu) places it between the banner and main, so "skip to main" really
// skips it. Outside AppShell there is no slot, and the page renders it inline.
const BeforeMainContext = createContext<((node: ReactNode) => void) | null>(null);

/**
 * Render `node` between the header and main, for as long as the caller is
 * mounted. Returns false outside AppShell, where the caller renders it itself.
 * `node` must be stable (memoised), or it is placed again on every render.
 */
export function useBeforeMain(node: ReactNode): boolean {
  const place = useContext(BeforeMainContext);
  useLayoutEffect(() => {
    if (!place) return;
    place(node);
    return () => place(null);
  }, [place, node]);
  return place !== null;
}

export function AppShell({ children }: AppShellProps) {
  const [beforeMain, setBeforeMain] = useState<ReactNode>(null);
  return (
    <SafeAreaView style={styles.container}>
      {/* The banner landmark; on web, react-native-web renders a <header>. */}
      <View style={styles.header} role="banner">
        <Wordmark size={20} />
        <CrisisHelp />
      </View>
      {beforeMain}
      {/* The page's one main landmark (<main> on web). Screens never add
          their own. It takes focus by script only, for skip links. */}
      <View
        role="main"
        nativeID={MAIN_ID}
        style={styles.content}
        {...({ tabIndex: -1 } as object)}
      >
        <BeforeMainContext.Provider value={setBeforeMain}>{children}</BeforeMainContext.Provider>
      </View>
      {/* The contentinfo landmark (<footer> on web): "Contact us" in the same
          place on every surface (SC 3.2.6), and the one status region
          (ADR 0022), inside a landmark and present before anything changes. */}
      <View style={styles.footer} role="contentinfo">
        <ContactLink />
        <StatusRegion />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.paper,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // The render-failure fallback is a paragraph, not a button; let it wrap
    // instead of squeezing the wordmark at 320px or with large text.
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: tokens.line,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: tokens.line,
  },
});
