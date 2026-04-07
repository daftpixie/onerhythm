import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { PublicSiteChrome } from "../components/public-site-chrome";
import { LAUNCH_HOST_HEADER } from "../lib/launch-mode";
import { absoluteUrl, getSiteUrl } from "../lib/site";

export const metadata: Metadata = {
  applicationName: "OneRhythm",
  authors: [{ name: "OneRhythm" }],
  metadataBase: new URL(getSiteUrl()),
  category: "health",
  creator: "OneRhythm",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/brand/logos/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/logos/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/brand/logos/favicon-180.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/brand/logos/favicon.svg"],
  },
  keywords: [
    "OneRhythm",
    "arrhythmia community",
    "arrhythmia education",
    "heart mosaic",
    "mental health and arrhythmia",
    "non-diagnostic educational platform",
    "cardiac arrhythmia support",
  ],
  manifest: "/manifest.webmanifest",
  publisher: "OneRhythm",
  title: {
    default: "OneRhythm",
    template: "%s | OneRhythm",
  },
  description:
    "OneRhythm is a public, educational arrhythmia platform built around a heart mosaic, calm learning, community visibility, and clear privacy boundaries.",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: "OneRhythm",
    description:
      "OneRhythm is a public, educational arrhythmia platform built around a heart mosaic, calm learning, community visibility, and clear privacy boundaries.",
    locale: "en_US",
    url: absoluteUrl("/"),
    siteName: "OneRhythm",
    type: "website",
    images: [
      {
        url: absoluteUrl("/brand/og/og-default-1200x630.png"),
        width: 1200,
        height: 630,
        alt: "OneRhythm",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OneRhythm",
    description:
      "OneRhythm is a public, educational arrhythmia platform built around a heart mosaic, calm learning, community visibility, and clear privacy boundaries.",
    images: [absoluteUrl("/brand/og/og-twitter-1200x628.png")],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const isLaunchHost = requestHeaders.get(LAUNCH_HOST_HEADER) === "1";

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-void font-body antialiased">
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[0.9rem] focus:bg-pulse focus:px-4 focus:py-3 focus:text-text-primary"
          href="#main-content"
        >
          Skip to content
        </a>
        <PublicSiteChrome isLaunchHost={isLaunchHost}>{children}</PublicSiteChrome>
      </body>
    </html>
  );
}
