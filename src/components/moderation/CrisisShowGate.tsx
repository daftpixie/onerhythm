import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { type PressState } from "../../lib/pressable";
import { mod } from "./styles";

// The gentle gate on a post that talks about very hard feelings (Q8, decided
// 2026-10-29; ADR 0022). An inline disclosure, never a modal over the feed.
//
// Whether to show it is decided on the reader's own device, against the
// published crisis list (ADR 0019 §8): nothing is stored, logged or sent, and
// no tag is put on the post. This component only draws the gate.
//
// Once shown, the post is never hidden from assistive technology. Focus stays
// on the button, which says what it will do next.
export function CrisisShowGate({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false);
  return (
    <View style={mod.block}>
      <Text style={mod.body}>This post talks about very hard feelings.</Text>
      <Pressable
        onPress={() => setShown((s) => !s)}
        role="button"
        accessibilityRole="button"
        aria-expanded={shown}
        style={({ focused, pressed }: PressState) => [
          mod.button,
          pressed && mod.pressed,
          focused && mod.focusRing,
        ]}
      >
        <Text style={mod.buttonText}>{shown ? "Hide this post" : "Show this post"}</Text>
      </Pressable>
      {shown && <View style={mod.block}>{children}</View>}
    </View>
  );
}
