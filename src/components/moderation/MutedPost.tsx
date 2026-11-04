import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { type PressState } from "../../lib/pressable";
import { mod } from "./styles";

// A post that matches one of the reader's muted words (plan §4.8). Never
// hidden silently: it folds behind a button that says why, and the button
// shows it. The match happens on this device; nothing is sent.
export function MutedPost({ word, children }: { word: string; children: ReactNode }) {
  const [shown, setShown] = useState(false);
  return (
    <View style={mod.block}>
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
        <Text style={mod.buttonText}>
          {shown
            ? `Hide post with the word '${word}'`
            : `Show post hidden because of the word '${word}'`}
        </Text>
      </Pressable>
      {shown && <View style={mod.block}>{children}</View>}
    </View>
  );
}
