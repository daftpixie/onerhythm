// Setup for the "rn" jest project.
//
// @react-native-async-storage/async-storage has no native module under jest,
// so importing it throws. The package ships an in-memory mock for exactly
// this; device-only stores (muted words, Q6) are tested through it.
jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
