"use client";

import { motion } from "framer-motion";

import type { MosaicTileMetadata } from "@onerhythm/types";

type ArtRevealProps = {
  tile?: MosaicTileMetadata | null;
  variant?: "ready" | "fallback" | "loading";
  size?: "full" | "compact";
};

type Palette = {
  frame: string;
  surface: string;
  glow: string;
  primary: string;
  secondary: string;
  highlight: string;
  grid: string;
};

const FALLBACK_TILE: MosaicTileMetadata = {
  tile_id: "fallback-tile",
  condition_category: "other",
  contributed_at: "1970-01-01T00:00:00.000Z",
  is_public: false,
  display_date: "1970-01-01",
  tile_version: 1,
  render_version: "branded-fallback-v1",
  visual_style: {
    color_family: "signal",
    opacity: 0.84,
    texture_kind: "grain",
    glow_level: "subtle",
  },
};

const PALETTES: Record<MosaicTileMetadata["visual_style"]["color_family"], Palette> = {
  pulse: {
    frame: "#2e1018",
    surface: "#160810",
    glow: "rgba(255, 91, 127, 0.3)",
    primary: "#ff6e8c",
    secondary: "#ffd1da",
    highlight: "#7ce7ff",
    grid: "rgba(255, 180, 195, 0.16)",
  },
  signal: {
    frame: "#0d1f2e",
    surface: "#07111a",
    glow: "rgba(0, 212, 255, 0.28)",
    primary: "#2fd7ff",
    secondary: "#c7f7ff",
    highlight: "#ff7d95",
    grid: "rgba(92, 231, 255, 0.16)",
  },
  aurora: {
    frame: "#1b1431",
    surface: "#0c0818",
    glow: "rgba(167, 139, 250, 0.3)",
    primary: "#b396ff",
    secondary: "#ece1ff",
    highlight: "#49d2ff",
    grid: "rgba(204, 191, 255, 0.16)",
  },
};

const SIZE_CLASSNAMES = {
  full: "max-w-[38rem]",
  compact: "max-w-[24rem]",
} as const;

function hashString(value: string): number {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed: number, offset: number): number {
  const raw = Math.sin((seed + 1) * 0.0001 + offset * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}

function formatAttribution(
  attribution: MosaicTileMetadata["visual_style"]["attribution"] | undefined,
): string | null {
  if (!attribution) {
    return null;
  }

  const parts = [
    attribution.contributor_name,
    attribution.contributor_location,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : null;
}

function buildTextureOverlay(
  textureKind: MosaicTileMetadata["visual_style"]["texture_kind"],
  palette: Palette,
): string {
  if (textureKind === "ripple") {
    return [
      `radial-gradient(circle at 18% 48%, ${palette.secondary}18 0 12%, transparent 13% 34%)`,
      `radial-gradient(circle at 76% 58%, ${palette.highlight}16 0 13%, transparent 14% 36%)`,
      "linear-gradient(180deg, rgba(248, 250, 252, 0.06), transparent 72%)",
    ].join(",");
  }

  if (textureKind === "grain") {
    return [
      `radial-gradient(circle at 6% 20%, ${palette.secondary}22 0 1px, transparent 1.7px)`,
      `radial-gradient(circle at 64% 72%, ${palette.primary}18 0 1px, transparent 2px)`,
      "linear-gradient(180deg, rgba(248, 250, 252, 0.06), transparent 78%)",
    ].join(",");
  }

  return [
    "linear-gradient(180deg, rgba(248, 250, 252, 0.08), transparent 70%)",
    `radial-gradient(circle at 88% 18%, ${palette.secondary}14, transparent 30%)`,
  ].join(",");
}

function glowShadow(
  glowLevel: MosaicTileMetadata["visual_style"]["glow_level"],
  palette: Palette,
): string {
  if (glowLevel === "bright") {
    return `0 0 42px ${palette.glow}, 0 0 84px color-mix(in srgb, ${palette.primary} 12%, transparent)`;
  }

  if (glowLevel === "subtle") {
    return `0 0 30px ${palette.glow}`;
  }

  return "0 0 0 rgba(0, 0, 0, 0)";
}

function buildFallbackPoints(seed: number): Array<{ x: number; y: number }> {
  return Array.from({ length: 18 }, (_, index) => {
    const position = index / 17;
    const primary = Math.sin(position * Math.PI * 4.2 + seededUnit(seed, 4) * Math.PI * 2);
    const secondary = Math.sin(position * Math.PI * 9.6 + seededUnit(seed, 7) * Math.PI * 2);
    return {
      x: position,
      y: 0.5 + (primary * 0.18) + (secondary * 0.06),
    };
  });
}

function mergeSignatureBands(
  waveformSignature: MosaicTileMetadata["visual_style"]["waveform_signature"],
): Array<{ x: number; y: number }> | null {
  const bands = waveformSignature?.bands ?? [];
  if (bands.length === 0) {
    return null;
  }

  const pointCount = Math.max(...bands.map((band) => band.points.length));
  if (pointCount <= 0) {
    return null;
  }

  return Array.from({ length: pointCount }, (_, index) => {
    let xSum = 0;
    let ySum = 0;
    let weightSum = 0;

    bands.forEach((band) => {
      const point = band.points[index];
      if (!point) {
        return;
      }
      const weight = Math.max(band.emphasis, 0.2);
      xSum += point.x * weight;
      ySum += point.y * weight;
      weightSum += weight;
    });

    return {
      x: weightSum > 0 ? xSum / weightSum : index / Math.max(pointCount - 1, 1),
      y: weightSum > 0 ? ySum / weightSum : 0.5,
    };
  });
}

function extendLine(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  if (points.length < 2) {
    return points;
  }

  const first = points[0];
  const second = points[1];
  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];
  const leadingY = Math.max(0.06, Math.min(0.94, first.y - (second.y - first.y) * 0.28));
  const trailingY = Math.max(0.06, Math.min(0.94, last.y + (last.y - penultimate.y) * 0.28));

  return [
    { x: -0.04, y: leadingY },
    ...points,
    { x: 1.04, y: trailingY },
  ];
}

function buildConnectedPath(points: Array<{ x: number; y: number }>): string {
  const extended = extendLine(points);
  if (extended.length === 0) {
    return "";
  }

  const left = -18;
  const width = 596;
  const midline = 138;
  const amplitude = 114;

  return extended
    .map((point, index) => {
      const x = left + point.x * width;
      const y = midline + ((point.y - 0.5) * amplitude);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildSecondaryPath(points: Array<{ x: number; y: number }>, seed: number): string {
  const shifted = points.map((point, index) => ({
    x: point.x,
    y: Math.max(
      0.08,
      Math.min(0.92, point.y + (Math.sin(index * 0.65 + seededUnit(seed, 18)) * 0.028)),
    ),
  }));
  return buildConnectedPath(shifted);
}

function buildJoinMarkers(points: Array<{ x: number; y: number }>): Array<{ cx: number; cy: number }> {
  const extended = extendLine(points);
  if (extended.length < 2) {
    return [];
  }

  return [extended[1], extended[extended.length - 2]].map((point) => ({
    cx: -18 + point.x * 596,
    cy: 138 + ((point.y - 0.5) * 114),
  }));
}

function buildConstellation(seed: number): Array<{ cx: number; cy: number; r: number; opacity: number }> {
  return Array.from({ length: 10 }, (_, index) => ({
    cx: 42 + (index * 52) + seededUnit(seed, index + 22) * 18,
    cy: 34 + seededUnit(seed, index + 40) * 190,
    r: 1.5 + seededUnit(seed, index + 72) * 3.4,
    opacity: 0.1 + seededUnit(seed, index + 91) * 0.22,
  }));
}

export function ArtReveal({
  tile,
  variant = "ready",
  size = "full",
}: ArtRevealProps) {
  const resolvedTile = tile ?? FALLBACK_TILE;
  const palette = PALETTES[resolvedTile.visual_style.color_family];
  const seed = hashString(
    `${resolvedTile.tile_id}:${resolvedTile.render_version}:${resolvedTile.visual_style.texture_kind}`,
  );
  const basePoints =
    mergeSignatureBands(resolvedTile.visual_style.waveform_signature) ?? buildFallbackPoints(seed);
  const primaryPath = buildConnectedPath(basePoints);
  const secondaryPath = buildSecondaryPath(basePoints, seed);
  const joinMarkers = buildJoinMarkers(basePoints);
  const constellation = buildConstellation(seed);
  const glow = glowShadow(resolvedTile.visual_style.glow_level, palette);
  const attributionLine = formatAttribution(resolvedTile.visual_style.attribution);
  const lineOpacity =
    variant === "loading"
      ? 0.58
      : variant === "fallback"
        ? 0.7
        : 0.92;

  return (
    <motion.figure
      animate={{ opacity: 1, scale: 1 }}
      className={`relative w-full ${SIZE_CLASSNAMES[size]}`}
      initial={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        aria-hidden="true"
        className="absolute -inset-x-8 -inset-y-5 rounded-[3rem] blur-3xl"
        style={{
          background: `radial-gradient(circle at 50% 48%, ${palette.glow}, transparent 70%)`,
          opacity: variant === "fallback" ? 0.78 : 0.92,
        }}
      />

      <div
        className="relative aspect-[20/9] w-full overflow-hidden rounded-[2.2rem] border border-white/10"
        data-testid="art-reveal-tile"
        style={{
          background: [
            `linear-gradient(118deg, ${palette.frame} 0%, ${palette.surface} 44%, ${palette.frame} 100%)`,
            `radial-gradient(circle at 16% 50%, ${palette.secondary}14, transparent 24%)`,
            `radial-gradient(circle at 84% 46%, ${palette.highlight}16, transparent 28%)`,
          ].join(","),
          boxShadow: glow,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: [
              `linear-gradient(90deg, ${palette.grid} 1px, transparent 1px)`,
              `linear-gradient(180deg, ${palette.grid} 1px, transparent 1px)`,
            ].join(","),
            backgroundSize: "44px 44px",
          }}
        />

        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: buildTextureOverlay(resolvedTile.visual_style.texture_kind, palette),
            backgroundSize:
              resolvedTile.visual_style.texture_kind === "grain"
                ? "13px 13px, 17px 17px, auto"
                : "cover",
            opacity: resolvedTile.visual_style.opacity,
          }}
        />

        <div
          aria-hidden="true"
          className="absolute inset-y-[18%] left-[7%] w-[36%] rounded-full blur-3xl"
          style={{
            background: `linear-gradient(90deg, ${palette.secondary}2a, transparent)`,
            opacity: 0.55,
          }}
        />

        <div
          aria-hidden="true"
          className="absolute inset-y-[24%] right-[6%] w-[28%] rounded-full blur-3xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${palette.highlight}24)`,
            opacity: 0.48,
          }}
        />

        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 560 252"
        >
          <defs>
            <linearGradient id={`segment-line-${seed}`} x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor={palette.secondary} stopOpacity="0.56" />
              <stop offset="42%" stopColor={palette.primary} stopOpacity="1" />
              <stop offset="100%" stopColor={palette.highlight} stopOpacity="0.66" />
            </linearGradient>
            <filter id={`segment-glow-${seed}`} x="-30%" y="-120%" width="160%" height="340%">
              <feGaussianBlur result="blurred" stdDeviation="8" />
              <feMerge>
                <feMergeNode in="blurred" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <line
            stroke={palette.grid}
            strokeDasharray="5 12"
            strokeLinecap="round"
            strokeWidth="1.25"
            x1="0"
            x2="560"
            y1="138"
            y2="138"
          />

          <path
            d={secondaryPath}
            fill="none"
            opacity="0.22"
            stroke={palette.secondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="12"
          />

          <path
            d={primaryPath}
            fill="none"
            filter={`url(#segment-glow-${seed})`}
            opacity={lineOpacity}
            stroke={`url(#segment-line-${seed})`}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4.8"
          />

          {joinMarkers.map((marker, index) => (
            <g key={`${marker.cx}-${marker.cy}-${index}`}>
              <circle
                cx={marker.cx}
                cy={marker.cy}
                fill={palette.primary}
                opacity="0.78"
                r="4.2"
              />
              <circle
                cx={marker.cx}
                cy={marker.cy}
                fill="none"
                opacity="0.28"
                r="10"
                stroke={palette.secondary}
                strokeWidth="1.4"
              />
            </g>
          ))}

          {constellation.map((dot, index) => (
            <circle
              key={index}
              cx={dot.cx}
              cy={dot.cy}
              fill={index % 3 === 0 ? palette.highlight : palette.secondary}
              opacity={dot.opacity}
              r={dot.r}
            />
          ))}
        </svg>

        {attributionLine ? (
          <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/24 px-4 py-2 backdrop-blur-sm">
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-signal-soft">
              {attributionLine}
            </p>
          </div>
        ) : null}
      </div>
    </motion.figure>
  );
}
