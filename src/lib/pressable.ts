import type { PressableStateCallbackType } from "react-native";

// RN's exported PressableStateCallbackType (0.85) does not yet type the `focused`
// / `hovered` states that react-native-web provides at runtime. We rely on
// `focused` to render a visible focus ring (WCAG 2.2). This widens the callback
// param without changing runtime behavior.
export type PressState = PressableStateCallbackType & {
  focused?: boolean;
  hovered?: boolean;
};
