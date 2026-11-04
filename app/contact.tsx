import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ContactLine } from "../src/components/ContactLine";
import { CrisisLinks } from "../src/components/moderation/CrisisLinks";
import { getGates, type GateStatus } from "../src/lib/moderation/api";
import { isLandingMode } from "../src/lib/site";
import { supabase } from "../src/lib/supabase";
import { tokens } from "../src/theme/tokens";

// Contact us (plan §4.8; ADR 0022: the footer link on every surface leads
// here, SC 3.2.6). Plain and honest: the review sentence reads G1 (ADR 0021),
// so it promises nothing while no review staffing is in place.
//
// In the landing build (ADR 0023) there are no posts to report and no
// Supabase, so the gate is never read and the reporting section is left out.
// The address is the one public contact line (src/lib/site.ts).

export default function ContactScreen() {
  const landing = isLandingMode();
  const [g1, setG1] = useState<GateStatus>("unmet");
  useEffect(() => {
    if (landing) return;
    getGates(supabase)
      .then((g) => setG1(g.G1))
      .catch(() => setG1("unmet"));
  }, [landing]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.main}>
        <Text role="heading" aria-level={1} style={styles.heading}>
          Contact us
        </Text>

        <Text role="heading" aria-level={2} style={styles.subheading}>
          If you or someone else is not safe right now
        </Text>
        <Text style={styles.body}>
          Please don&apos;t wait for us. In the US, call or text 988. In an emergency,
          call your local emergency number.
        </Text>
        <CrisisLinks which={["call988", "text988", "emergency"]} />

        {landing ? null : (
          <>
            <Text role="heading" aria-level={2} style={styles.subheading}>
              A post or comment that worries you
            </Text>
            <Text style={styles.body}>
              {g1 === "met"
                ? 'Use "Report" under the post or comment. We save every report, and a trained person reviews it.'
                : 'Use "Report" under the post or comment. We save every report. We haven\'t set up our review team yet, so we can\'t say when someone will look at it.'}
            </Text>
          </>
        )}

        <Text role="heading" aria-level={2} style={styles.subheading}>
          Anything else
        </Text>
        <ContactLine lead="Email us." />
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
  subheading: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "700",
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_700Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.ink,
    fontFamily: "AtkinsonHyperlegible_400Regular",
    marginBottom: 8,
  },
});
