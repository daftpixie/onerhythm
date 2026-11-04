import { type ReactNode } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { type PressState } from "../lib/pressable";
import { focus, tokens } from "../theme/tokens";

// A link to another screen in the app. It keeps a real href (so it is a real
// <a> on web, works without script, and shows where it goes), but a click
// navigates inside the app instead of loading the whole page again. A full
// reload would wipe what lives in memory, such as an appeal draft (ADR 0022,
// SC 3.3.7). On native, where there is no href, the press navigates.
export function navigateInApp(href: string) {
  try {
    router.push(href as never);
  } catch {
    if (Platform.OS === "web" && typeof window !== "undefined") window.location.assign(href);
  }
}

export function InAppLink({
  href,
  label,
  children,
}: {
  href: string;
  /** The accessible name, when it should differ from the visible text. */
  label?: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      role="link"
      accessibilityRole="link"
      aria-label={label}
      {...({ href } as object)}
      onPress={(e) => {
        const ev = e as unknown as {
          preventDefault?: () => void;
          metaKey?: boolean;
          ctrlKey?: boolean;
          shiftKey?: boolean;
          button?: number;
        };
        // Let the browser handle "open in a new tab or window".
        if (ev?.metaKey || ev?.ctrlKey || ev?.shiftKey || (ev?.button ?? 0) !== 0) return;
        ev?.preventDefault?.();
        navigateInApp(href);
      }}
      style={({ focused, pressed }: PressState) => [
        styles.link,
        pressed && styles.pressed,
        focused && styles.focusRing,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  pressed: { opacity: 0.85 },
  focusRing: {
    outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset,
  },
});
