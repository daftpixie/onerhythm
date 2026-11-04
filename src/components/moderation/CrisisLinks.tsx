import { Linking, Platform, Pressable, Text, View } from "react-native";
import { type PressState } from "../../lib/pressable";
import { mod } from "./styles";

// Tap-to-act crisis links with real hrefs (ADR 0022: "links are real links"),
// so they work if a script handler fails and long-press shows the number. The
// numbers are the crisis sheet's (tests/shared/contracts/crisis-help-sheet.ts).
export const CRISIS_ACTIONS = {
  call988: { label: "Call 988", url: "tel:988" },
  text988: { label: "Text 988", url: "sms:988" },
  emergency: { label: "Call 911 (US)", url: "tel:911" },
} as const;

export type CrisisAction = keyof typeof CRISIS_ACTIONS;

export function CrisisLink({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      role="link"
      accessibilityRole="link"
      aria-label={label}
      {...({ href: url } as object)}
      // On native there is no href: open the number directly.
      onPress={Platform.OS === "web" ? undefined : () => Linking.openURL(url).catch(() => {})}
      style={({ focused, pressed }: PressState) => [
        mod.button,
        pressed && mod.pressed,
        focused && mod.focusRing,
      ]}
    >
      <Text style={mod.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function CrisisLinks({ which }: { which: CrisisAction[] }) {
  return (
    <View style={mod.row}>
      {which.map((k) => (
        <CrisisLink key={k} {...CRISIS_ACTIONS[k]} />
      ))}
    </View>
  );
}
