import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// Honors the OS "reduce motion" setting (WCAG 2.2 — no ambient/looping motion;
// honor prefers-reduced-motion). Used to suppress the crisis sheet's slide-in.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      active = false;
      // Defensive, not cosmetic. react-native-web's
      // AccessibilityInfo.addEventListener returns undefined outright when
      // window.matchMedia is unavailable, so this cleanup can be handed
      // nothing. Every current browser has matchMedia — but the baseline user
      // here is on an older device, and the cost of being wrong is a crash on
      // unmount of the screen carrying the crisis affordance.
      sub?.remove?.();
    };
  }, []);

  return reduced;
}
