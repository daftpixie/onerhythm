function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return defaultValue;
}

export type WebProductFlags = {
  missionV3Enabled: boolean;
  legacyMosaicEnabled: boolean;
};

export function getWebProductFlags(
  env: Record<string, string | undefined> = process.env,
): WebProductFlags {
  return {
    missionV3Enabled: parseBooleanFlag(env.NEXT_PUBLIC_MISSION_V3_ENABLED, true),
    legacyMosaicEnabled: parseBooleanFlag(env.NEXT_PUBLIC_LEGACY_MOSAIC_ENABLED, false),
  };
}

export const webProductFlags = getWebProductFlags();
