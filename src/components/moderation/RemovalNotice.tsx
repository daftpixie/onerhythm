import { Pressable, Text, View } from "react-native";
import { type PressState } from "../../lib/pressable";
import { CrisisLinks } from "./CrisisLinks";
import { mod } from "./styles";

// The removal notice, in place of the removed post (ADR 0022; plan §4.4).
//
// The author sees which safety rule and can ask us to look again. Everyone
// else sees a generic "Removed" list item, never the rule (so the public log
// cannot be matched to a visible post). When the post had crisis language, the
// author's notice carries the crisis resources in the same block (plan §5.1,
// crisis adjacency).
export interface RemovalNoticeProps {
  viewer: "author" | "other";
  floorItemText: string;
  crisis: boolean;
  /** Omitted when there is no action to ask about; the button is then not shown. */
  onAskAgain?: () => void;
}

export function RemovalNotice({ viewer, floorItemText, crisis, onAskAgain }: RemovalNoticeProps) {
  if (viewer === "other") {
    return (
      <View role="listitem" style={mod.panel}>
        <Text style={mod.body}>Removed</Text>
      </View>
    );
  }
  return (
    <View role="group" aria-label="About this post" style={mod.panel}>
      <Text style={mod.body}>
        {floorItemText
          ? `We removed your post. It broke one of our safety rules: ${floorItemText}.`
          : "We removed your post. It broke one of our safety rules."}
        {onAskAgain ? " You can ask us to look again." : ""}
      </Text>
      {crisis && (
        <View style={mod.block}>
          <Text style={mod.body}>
            If you are having very hard feelings or might hurt yourself, help is
            here now. In the US, call or text 988. In an emergency, call your local
            emergency number.
          </Text>
          <CrisisLinks which={["call988", "text988", "emergency"]} />
        </View>
      )}
      {onAskAgain && (
      <Pressable
        onPress={onAskAgain}
        role="button"
        accessibilityRole="button"
        style={({ focused, pressed }: PressState) => [
          mod.button,
          pressed && mod.pressed,
          focused && mod.focusRing,
        ]}
      >
        <Text style={mod.buttonText}>Ask us to look again</Text>
      </Pressable>
      )}
    </View>
  );
}
