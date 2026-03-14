type ResponseHeader = {
  key: string;
  value: string;
};

type HeaderRule = {
  source: string;
  headers: ResponseHeader[];
};

const BASELINE_HEADERS: ResponseHeader[] = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=()" },
];

const HSTS_HEADER: ResponseHeader = {
  key: "Strict-Transport-Security",
  value: "max-age=63072000; includeSubDomains; preload",
};

const EXPERIMENTAL_HEADERS: ResponseHeader[] = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "X-OneRhythm-Release-Stage", value: "experimental" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

export const experimentalRouteSources = [
  "/sign-in",
  "/sign-up",
  "/onboarding/:path*",
  "/education/:path*",
  "/account/:path*",
] as const;

export function buildWebResponseHeaderRules(environment: string = process.env.NODE_ENV ?? "development"): HeaderRule[] {
  const normalizedEnvironment = environment.trim().toLowerCase();
  const baselineHeaders =
    normalizedEnvironment === "production" || normalizedEnvironment === "staging"
      ? [...BASELINE_HEADERS, HSTS_HEADER]
      : BASELINE_HEADERS;

  return [
    {
      source: "/:path*",
      headers: baselineHeaders,
    },
    ...experimentalRouteSources.map((source) => ({
      source,
      headers: EXPERIMENTAL_HEADERS,
    })),
  ];
}

