import { Text, View, StyleSheet } from "react-native";
import { tokens } from "../theme/tokens";

export function DisclaimerBand() {
  return (
    <View testID="disclaimer-band" style={styles.band}>
      <View style={styles.labelRow}>
        <Text style={styles.icon} accessibilityLabel="Information">
          ℹ
        </Text>
        <Text style={styles.label}>Disclaimer</Text>
      </View>
      <Text style={styles.body}>
        General information, not medical advice. Talk to your own clinician.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: tokens.fill,
    borderLeftWidth: 3,
    borderLeftColor: tokens.ink,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  icon: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginRight: 6,
  },
  label: {
    fontSize: 16,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    color: tokens.inkSecondary,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.inkSecondary,
    // The disclaimer sentence itself. It had NO fontFamily and was rendering
    // in the platform default on every health page — only the word
    // "Disclaimer" above it was in Atkinson. Invisible to the typeface suite
    // until that suite stopped skipping nodes with no declared family.
    fontFamily: "AtkinsonHyperlegible_400Regular",
  },
});
