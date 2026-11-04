import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { type PressState } from "../../lib/pressable";
import { CrisisLinks } from "./CrisisLinks";
import { navigateInApp } from "../InAppLink";
import { focusNode } from "./panel";
import { mod } from "./styles";

// Crisis resources shown at once to the author of a post that matches the
// published crisis list (plan §4.6; ADR 0022; T12).
//
// Inline, above the post, on the same render. Not a modal, so nothing blocks
// the post or the header. Its heading takes focus; it is not an alert or a
// live region, so it is not read twice. Never timed or auto-dismissed. Nothing
// is logged or sent, and no country is stored.
//
// Crisis triage does not run on member content until G6 (ADR 0019 §8). This
// panel is built and tested now, and shown only once triage runs.
export function PostSubmitCrisisPanel({ gates }: { gates: { G1: "met" | "unmet" } }) {
  const headingRef = useRef<Text>(null);
  useEffect(() => {
    focusNode(headingRef.current);
  }, []);

  return (
    <View style={mod.panel}>
      <Text
        ref={headingRef}
        role="heading"
        aria-level={2}
        style={mod.heading}
        {...({ tabIndex: -1 } as object)}
      >
        If you might hurt yourself, or you are not safe, get help now.
      </Text>
      <Text style={mod.body}>
        In the US, call or text 988. In an emergency, call your local emergency
        number.
      </Text>
      <CrisisLinks which={["call988", "text988", "emergency"]} />
      <Pressable
        role="link"
        accessibilityRole="link"
        {...({ href: "/help/other-countries" } as object)}
        // Navigate inside the app: no full reload on web, and it works on native.
        onPress={(e) => {
          (e as unknown as { preventDefault?: () => void })?.preventDefault?.();
          navigateInApp("/help/other-countries");
        }}
        style={({ focused, pressed }: PressState) => [
          mod.button,
          pressed && mod.pressed,
          focused && mod.focusRing,
        ]}
      >
        <Text style={mod.buttonText}>Help in another country</Text>
      </Pressable>
      {gates.G1 === "unmet" && (
        <Text style={mod.body}>No one from OneRhythm will contact you about this post.</Text>
      )}
    </View>
  );
}
