import { Platform } from "react-native";

// Delivering the export file.
//
// Web only, deliberately. There is no expo-file-system or expo-sharing in the
// dependency list, so on iOS/Android there is nowhere to put the file, and
// adding a dependency inside a launch-gate commit is not a trade worth making.
// Launch is the web surface, so this closes the gate for launch; native export
// is deferred to Phase 5 (founder ruling, recorded in ADR 0012).
//
// The screen must ask canDownload() and say so in plain words rather than
// offering a button that fails.

export function canDownload(): boolean {
  return Platform.OS === "web";
}

/** Hand the member a file. Nothing is uploaded, stored, or sent anywhere: the
 *  document is built in memory from their own session and released immediately. */
export function downloadJson(filename: string, text: string): void {
  if (!canDownload()) {
    throw new Error("Downloading is available on the OneRhythm website.");
  }
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    // Release the object URL even if the click threw, so a long session cannot
    // accumulate copies of a member's data in memory.
    URL.revokeObjectURL(url);
  }
}
