// Three projects:
//  - "rn": React Native / UI tests via jest-expo + RNTL (jsdom-ish RN env).
//  - "web": jsdom + react-native-web, rendered with react-dom and queried with
//    @testing-library/dom. Web is the deploy target; the "rn" project renders
//    through react-test-renderer and therefore checks the prop a component
//    INTENDED to set, never what a browser actually receives. Three web-only
//    a11y defects shipped green through that gap. See ADR 0014.
//  - "db": Node integration tests against the LOCAL Supabase stack. These need a
//    REAL fetch, so they run in a plain node environment WITHOUT the jest-expo
//    preset (which mocks fetch). They require the local stack + .env.test.
// Expo Router imports standard-navigation's ESM build. Transform it for
// both renderers, just like the Expo modules; do not mock away the router.
const rnTransformIgnore =
  "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|standard-navigation|nativewind|react-native-css-interop|lucide-react-native|react-native-svg|react-native-reanimated)";

module.exports = {
  projects: [
    {
      displayName: "rn",
      preset: "jest-expo",
      transformIgnorePatterns: [rnTransformIgnore],
      setupFiles: ["<rootDir>/tests/rn-setup.ts"],
      testMatch: [
        "<rootDir>/tests/components/**/*.test.{ts,tsx}",
        "<rootDir>/tests/screens/**/*.test.{ts,tsx}",
        "<rootDir>/tests/unit/**/*.test.{ts,tsx}",
      ],
    },
    {
      displayName: "web",
      preset: "jest-expo/web",
      // The web preset gives us jsdom, the `^react-native$` -> react-native-web
      // moduleNameMapper the Expo web build uses, caller.platform = "web" (so
      // Platform.OS inlines honestly), and a web-first haste/extension order
      // that picks react-native-svg's real-<svg> web build.
      //
      // But getPlatformPreset REPLACES the base preset's babel options with
      // `{caller}` alone, discarding the presets the base preset injects via
      // resolveBabelOptions. That is fine for an app with a babel.config.js;
      // this repo has none and relies on jest-expo injecting
      // expo/internal/babel-preset programmatically. Without the override below
      // every .tsx fails with "Support for the experimental syntax 'jsx' isn't
      // currently enabled". Overriding `transform` HERE rather than adding a
      // root babel.config.js keeps the 44 green "rn"/"db" suites untouched.
      transform: {
        "\\.[jt]sx?$": [
          "babel-jest",
          {
            root: __dirname,
            babelrc: false,
            configFile: false,
            presets: [require.resolve("expo/internal/babel-preset")],
            caller: { name: "metro", bundler: "metro", platform: "web" },
          },
        ],
      },
      transformIgnorePatterns: [rnTransformIgnore],
      setupFilesAfterEnv: ["<rootDir>/tests/web/setup.ts"],
      // MUST be overridden: the platform preset's own testMatch is broad
      // (**/?(*.)+(spec|test).[jt]s?(x)) and would sweep up all 44 existing
      // suites into the web renderer.
      testMatch: ["<rootDir>/tests/web/**/*.test.{ts,tsx}"],
    },
    {
      displayName: "db",
      testEnvironment: "node",
      // jest.setTimeout lives here (testTimeout isn't valid per-project); WSL
      // round-trips can exceed the 5s default, especially cold.
      setupFilesAfterEnv: ["<rootDir>/tests/db/setup.ts"],
      testMatch: ["<rootDir>/tests/db/**/*.test.ts"],
      transform: {
        "^.+\\.[jt]sx?$": [
          "babel-jest",
          {
            babelrc: false,
            configFile: false,
            presets: [
              ["@babel/preset-env", { targets: { node: "current" } }],
              "@babel/preset-typescript",
            ],
          },
        ],
      },
    },
  ],
  // Three projects on a 9.7 GiB WSL box that is also hosting the Supabase
  // stack. Jest's default (cores - 1 = 5 here) tips it over: the failures are
  // never assertions, they are 5s timeouts and AuthRetryableFetchError with an
  // empty body — the local auth container refusing connections under a burst
  // of parallel signInWithPassword calls. Adding the "web" project is what
  // pushed it past the line.
  //
  // A percentage rather than a fixed number so CI, with different core counts,
  // scales instead of being throttled to this laptop's shape.
  maxWorkers: "50%",
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
