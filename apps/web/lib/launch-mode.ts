const DEFAULT_LAUNCH_URL = "https://launch.onerhythm.org";
const DEFAULT_LAUNCH_HOST = "launch.onerhythm.org";

export const LAUNCH_HOST_HEADER = "x-onerhythm-launch-host";

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

function normalizeHost(host: string | null | undefined): string | null {
  if (!host) {
    return null;
  }

  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

export type LaunchModeConfig = {
  enabled: boolean;
  launchUrl: string;
  launchHost: string;
};

export function getLaunchModeConfig(
  env: Record<string, string | undefined> = process.env,
): LaunchModeConfig {
  const launchUrl = (env.NEXT_PUBLIC_LAUNCH_URL ?? DEFAULT_LAUNCH_URL).replace(/\/$/, "");
  const launchHost =
    normalizeHost(env.NEXT_PUBLIC_LAUNCH_HOST) ??
    normalizeHost(new URL(launchUrl).host) ??
    DEFAULT_LAUNCH_HOST;

  return {
    enabled: parseBooleanFlag(env.NEXT_PUBLIC_LAUNCH_MODE, false),
    launchUrl,
    launchHost,
  };
}

export function getRequestHost(
  headers: Pick<Headers, "get"> | { get(name: string): string | null },
): string | null {
  return normalizeHost(headers.get("x-forwarded-host") ?? headers.get("host"));
}

export function isLaunchHost(
  host: string | null | undefined,
  config: LaunchModeConfig = getLaunchModeConfig(),
): boolean {
  return normalizeHost(host) === config.launchHost;
}

export function buildLaunchUrl(
  path = "/",
  config: LaunchModeConfig = getLaunchModeConfig(),
): string {
  const url = new URL(config.launchUrl);
  url.pathname = path.startsWith("/") ? path : `/${path}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}
