/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // COLOURS LIVE IN src/theme/tokens.ts — deliberately not restated here.
      //
      // No component in this repo uses a NativeWind className (see ADR 0010);
      // every one styles via StyleSheet.create against tokens.ts. A `colors`
      // block here would be duplicated literals that nothing reads and that
      // tests/unit/contrast.test.ts cannot see — the exact drift guard #7
      // exists to prevent. Whether to adopt classNames at all is deferred to
      // its own session (ADR 0002, superseded-in-part).
      fontFamily: {
        sans: ["AtkinsonHyperlegible_400Regular", "system-ui", "sans-serif"],
        "sans-bold": ["AtkinsonHyperlegible_700Bold", "system-ui", "sans-serif"],
      },
      borderRadius: {
        input: "8px",
        card: "12px",
      },
    },
  },
  plugins: [],
};
