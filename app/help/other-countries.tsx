import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { type PressState } from "../../src/lib/pressable";
import { focus, tokens } from "../../src/theme/tokens";

// "Help in another country" (plan §4.6; T12). Static content: no location is
// asked for or stored, nothing is sent, and no analytics run here.
//
// The plan leaves the per-country list to the crisis-routing ADR (plan §7
// item 6). Until that list is chosen and checked, this page gives the one
// rule that holds everywhere and points to a public directory of helplines.
// It does not invent numbers.
export default function OtherCountriesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.main}>
        <Text role="heading" aria-level={1} style={styles.heading}>
          Help in another country
        </Text>
        <Text style={styles.body}>
          If you might hurt yourself, or you are not safe, call your local emergency
          number now.
        </Text>
        <Text style={styles.body}>
          To find a free crisis line where you live, this public directory lists
          helplines by country. It opens a website that is not run by OneRhythm.
        </Text>
        <Pressable
          role="link"
          accessibilityRole="link"
          {...({
            href: "https://findahelpline.com",
            hrefAttrs: { rel: "noopener noreferrer", target: "_blank" },
          } as object)}
          // Native has no href: open the site directly.
          onPress={
            Platform.OS === "web"
              ? undefined
              : () => Linking.openURL("https://findahelpline.com").catch(() => {})
          }
          style={({ focused, pressed }: PressState) => [
            styles.link,
            pressed && styles.pressed,
            focused && styles.focusRing,
          ]}
        >
          <Text style={styles.linkText}>Find a helpline (findahelpline.com, opens a new tab)</Text>
        </Pressable>
        <Text style={styles.hint}>
          We are still choosing and checking a list of crisis lines by country. Until
          then, we would rather point you to a maintained directory than give you a
          number we have not checked.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  main: { maxWidth: 680 },
  heading: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginBottom: 8,
  },
  hint: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginTop: 8,
  },
  link: { minHeight: 44, minWidth: 44, justifyContent: "center", alignSelf: "flex-start" },
  linkText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
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
