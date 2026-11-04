// Expectation contract for the crisis affordance, read by BOTH renderers.
//
// Why data and not a shared test body: the two projects cannot share a query
// layer. "rn" queries a react-test-renderer tree; "web" queries a DOM. A shared
// body would have to abstract over both and would end up testing the
// abstraction. Sharing the EXPECTATIONS kills the drift that actually matters —
// the two suites disagreeing about what the screen should say — while each side
// keeps its own honest queries.
//
// Platform-specific expectations are named fields here, visible to both sides,
// never a silent difference between two files.
//
// a11y.md: "The crisis affordance must be reachable from every screen; a silent
// failure to render it is a SAFETY incident, not a UI bug." Treat any change to
// this file as a change to a safety surface.

export const crisisHelpSheet = {
  trigger: {
    /** Icon AND text — a11y.md forbids icon-only controls. */
    glyph: "🆘",
    label: "Need help right now?",
    /** The accessible name must not include the glyph. */
    accessibleName: "Need help right now?",
    minTargetPx: 44,
  },

  title: {
    /** The glyph stays VISIBLE... */
    visibleText: "🆘 Need help right now?",
    /** ...but must never be spoken as "SOS Need help right now?". */
    accessibleName: "Need help right now?",
  },

  /** Emergency guidance comes FIRST, before peer-support framing. */
  body: [
    "If this is a medical emergency, call your local emergency number now.",
    "Feeling in crisis or unsafe?",
  ],

  /**
   * Tap-to-act, not just a website (plan §5.1, build step 0). Each action has a
   * visible text label that IS its accessible name (SC 2.5.3), and a 44px
   * target. The component has no region detection, so the numbers are the US
   * ones, said so in the label, beside the "local emergency number" line.
   */
  emergency: {
    label: "Call 911 (US)",
    url: "tel:911",
  },

  /**
   * Copy that names suicide or self-harm keeps the crisis actions in the SAME
   * block (plan §5.1, crisis adjacency). The header 🆘 does not count.
   */
  lifeline: {
    text: "In the US, call or text 988 for the Suicide & Crisis Lifeline.",
    call: { label: "Call 988", url: "tel:988" },
    sms: { label: "Text 988", url: "sms:988" },
  },

  /** The existing website link, kept. */
  resource: {
    text: "See mental-health crisis resources",
    url: "https://988lifeline.org/",
  },

  /**
   * Shown if the device cannot open a tel:/sms:/web link (no phone app, no
   * handler). A crisis action must never fail in silence (a11y.md).
   */
  openFailed:
    "Your device couldn't open that. Dial 911 in the US or your local " +
    "emergency number. For the Suicide & Crisis Lifeline, call or text 988.",

  /** Every crisis action, in reading order, emergency first. */
  actionOrder: ["Call 911 (US)", "Call 988", "Text 988", "See mental-health crisis resources"],

  dialog: {
    /** The sheet is a dialog, named by its title, without the glyph. */
    accessibleName: "Need help right now?",
  },

  /**
   * Shown if the sheet itself cannot render. Plain text and plain links, no
   * Modal, so a render failure never removes the crisis numbers. A silent
   * failure here is a safety incident (a11y.md).
   */
  fallback: {
    text:
      "Need help right now? In an emergency, call 911 in the US or your local " +
      "emergency number. In the US, call or text 988 for the Suicide & Crisis " +
      "Lifeline.",
    actions: [
      { label: "Call 911 (US)", url: "tel:911" },
      { label: "Call 988", url: "tel:988" },
      { label: "Text 988", url: "sms:988" },
    ],
  },

  /** Non-negotiable framing: peer support, never a substitute for care. */
  disclaimer:
    "This community is peer support — not a substitute for professional care.",

  close: { accessibleName: "Close" },

  webOnly: {
    /**
     * The title is a <Text> carrying an explicit accessibilityLabel, so RNW
     * renders a <div aria-label="..."> — NOT a heading. Asserted on web only
     * because only the DOM has a tag name at all.
     */
    titleHasAriaLabel: true,
    /**
     * accessibilityRole="link" maps to no HTML element in RNW's roleComponents
     * table, so the resource control stays a <div role="link"> rather than
     * becoming an <a href>. It is driven by Linking.openURL, not navigation.
     */
    resourceRole: "link",
  },

  nativeOnly: {
    /**
     * On iOS the sheet View sets accessibilityViewIsModal, so VoiceOver stays
     * inside it. Focus is moved with AccessibilityInfo.sendAccessibilityEvent:
     * to the title on open, back to the trigger on close.
     */
    viewIsModal: true,
  },

  webOnlyDialog: {
    /**
     * react-native-web's <Modal> gives the dialog role, aria-modal, Escape ->
     * onRequestClose and a focus trap. The trap holds focus INSIDE the sheet,
     * which contains every crisis action, so it never hides one. Earlier
     * versions of this file said jsdom showed no dialog semantics; that was
     * wrong, and these fields replace that note.
     */
    role: "dialog",
    ariaModal: "true",
    closesOnEscape: true,
  },
} as const;
