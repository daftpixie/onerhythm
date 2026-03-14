import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OneRhythm",
    short_name: "OneRhythm",
    description:
      "OneRhythm is a public, educational arrhythmia platform built around a heart mosaic, grounded learning, community visibility, and clear privacy boundaries.",
    start_url: "/",
    display: "browser",
    background_color: "#0a0e1a",
    theme_color: "#0a0e1a",
    icons: [
      {
        src: "/brand/logos/favicon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/brand/logos/onerhythm-mark-transparent-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/brand/logos/onerhythm-mark-transparent-1024.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}
