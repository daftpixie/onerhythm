import { ScrollView, StyleSheet, Text, View } from "react-native";
import { InAppLink } from "../src/components/InAppLink";
import { tokens } from "../src/theme/tokens";

// A path that matches no route. Without this file expo-router draws its own
// "Unmatched Route" screen OUTSIDE the root layout — so outside AppShell, with
// no crisis help in the header. Found while building the landing gate
// (ADR 0023). In the landing build the root layout's gate sends this path to
// "/" before this screen renders; in the member build this screen shows,
// inside the shell.
export default function NotFoundScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.main}>
        <Text role="heading" aria-level={1} style={styles.heading}>
          We can&apos;t find that page
        </Text>
        <Text style={styles.body}>
          The link may be old, or the address may have a typo. If you need help right
          now, the help button at the top of this page has crisis resources.
        </Text>
        <InAppLink href="/">
          <Text style={styles.linkText}>Go to the home page</Text>
        </InAppLink>
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
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginBottom: 16,
  },
  body: {
    fontSize: 18,
    lineHeight: 27,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginBottom: 12,
  },
  linkText: {
    fontSize: 18,
    lineHeight: 27,
    color: tokens.ink,
    textDecorationLine: "underline",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
});
