import { StyleSheet, Text } from "react-native";
import { InAppLink } from "./InAppLink";
import { tokens } from "../theme/tokens";

// "Contact us", in the same place on every surface (ADR 0022; plan §4.8;
// SC 3.2.6 Consistent Help). AppShell renders it once, in its footer. A real
// link with an href that navigates inside the app (InAppLink), so tapping it
// mid-appeal never loses the draft.
export function ContactLink() {
  return (
    <InAppLink href="/contact">
      <Text style={styles.text}>Contact us</Text>
    </InAppLink>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: tokens.ink,
    textDecorationLine: "underline",
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
});
