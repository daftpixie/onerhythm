const DEFAULT_SITE_URL = "http://127.0.0.1:3001";

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_ONERHYTHM_SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    DEFAULT_SITE_URL
  ).replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
