import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { type PressState } from "../lib/pressable";
import { CONTACT_EMAIL } from "../lib/site";
import { focus, tokens } from "../theme/tokens";

// A plain contact line: one sentence and an email link. Not a form, and it
// collects nothing (ADR 0023: the updates sign-up is off in the landing
// build). The address is the link's visible text, so a reader who cannot open
// a mail app can still copy it.
export function ContactLine({
  lead = "To get in touch, email us.",
  label,
}: {
  lead?: string;
  /** A fuller accessible name, when a page has more than one contact link. */
  label?: string;
}) {
  const href = `mailto:${CONTACT_EMAIL}`;
  return (
    <View style={styles.wrap}>
      <Text style={styles.body}>
        {lead} Please don&apos;t include health details.
      </Text>
      <Pressable
        role="link"
        accessibilityRole="link"
        aria-label={label}
        accessibilityLabel={label}
        {...({ href } as object)}
        // Web follows the href; native has none, so open the mail app.
        onPress={Platform.OS === "web" ? undefined : () => Linking.openURL(href).catch(() => {})}
        style={({ focused, pressed }: PressState) => [
          styles.link,
          pressed && styles.pressed,
          focused && styles.focusRing,
        ]}
      >
        <Text style={styles.linkText}>{CONTACT_EMAIL}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  body: {
    fontSize: 18,
    lineHeight: 27,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginBottom: 4,
  },
  // 44px: this is the page's primary action while sign-up is off.
  link: { minHeight: 44, minWidth: 44, justifyContent: "center", alignSelf: "flex-start" },
  linkText: {
    fontSize: 18,
    lineHeight: 27,
    color: tokens.ink,
    textDecorationLine: "underline",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
  pressed: { opacity: 0.85 },
  focusRing: {
    outlineWidth: focus.width,
    outlineColor: tokens.ink,
    outlineStyle: "solid",
    outlineOffset: focus.offset,
  },
});
