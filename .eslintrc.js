module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:jsx-a11y/recommended",
  ],
  plugins: ["@typescript-eslint", "react", "jsx-a11y"],
  settings: {
    react: { version: "detect" },
  },
  rules: {
    "no-console": "error",
  },
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ["node_modules/", "dist/", "build/", ".expo/"],
  overrides: [
    {
      files: ["tests/**/*.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            varsIgnorePattern: "^(React|_)",
            ignoreRestSiblings: true,
            caughtErrors: "none",
          },
        ],
      },
    },
  ],
};
