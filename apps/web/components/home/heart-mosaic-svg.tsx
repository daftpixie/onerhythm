"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type HeartMosaicSVGProps = {
  tileCount?: number;
  className?: string;
  /** Show the faint outline of the heart shape */
  showOutline?: boolean;
};

/* Parametric heart (x, y) in a coordinate space roughly -17..17 x -16..16 */
function heartX(t: number): number {
  return 16 * Math.pow(Math.sin(t), 3);
}

function heartY(t: number): number {
  return 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
}

function isInsideHeart(px: number, py: number): boolean {
  const x = px / 16;
  const y = py / 16;
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y < 0;
}

/* Generate outline path data from parametric curve */
function heartOutlinePath(): string {
  const steps = 120;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const x = heartX(t);
    const y = -heartY(t); // flip Y for SVG
    d += i === 0 ? `M${x.toFixed(2)},${y.toFixed(2)}` : `L${x.toFixed(2)},${y.toFixed(2)}`;
  }
  return d + "Z";
}

/* Brand palette for tiles */
const TILE_COLORS = [
  "#FF2D55", "#FF2D55", "#FF2D55",   // Pulse Red (weighted)
  "#00D4FF", "#00D4FF",               // Signal Cyan
  "#7C3AED",                          // Aurora Violet
  "#FF6B8A",                          // Pulse Glow
  "#A78BFA",                          // Aurora Glow
  "#66E5FF",                          // Signal Soft
];

type TileData = {
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity: number;
  delay: number;
};

/** Round to 4 decimal places to prevent server/client floating-point hydration mismatches */
function r4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function generateTiles(count: number): TileData[] {
  const tiles: TileData[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  // Deterministic seeded random from index
  function seeded(i: number): number {
    return ((i * 2654435761) >>> 0) / 4294967296;
  }

  for (let i = 0; tiles.length < count && i < count * 6; i++) {
    const rad = Math.sqrt(i / (count * 1.8)) * 14;
    const theta = i * goldenAngle;
    const x = rad * Math.cos(theta);
    const y = -(rad * Math.sin(theta) + 2); // offset into heart center, flip Y

    if (isInsideHeart(x, -y)) {
      // Check distance from center for density/brightness
      const distFromCenter = Math.sqrt(x * x + (y + 2) * (y + 2));
      const normalizedDist = Math.min(distFromCenter / 14, 1);

      // Tiles near center are larger and brighter
      const baseRadius = 0.55 + (1 - normalizedDist) * 0.45;
      const opacity = 0.35 + (1 - normalizedDist) * 0.55;

      // Check no overlap
      const tooClose = tiles.some(
        (t) => Math.hypot(t.cx - x, t.cy - y) < (baseRadius + t.r) * 1.15
      );
      if (!tooClose) {
        const colorIdx = Math.floor(seeded(i) * TILE_COLORS.length);
        tiles.push({
          cx: r4(x),
          cy: r4(y),
          r: r4(baseRadius),
          color: TILE_COLORS[colorIdx],
          opacity: r4(opacity),
          delay: r4(tiles.length * 0.015),
        });
      }
    }
  }

  return tiles;
}

const EASE_REVEAL: [number, number, number, number] = [0.16, 1, 0.3, 1];

const tileVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (delay: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay,
      duration: 0.5,
      ease: EASE_REVEAL,
    },
  }),
};

export function HeartMosaicSVG({
  tileCount = 120,
  className,
  showOutline = true,
}: HeartMosaicSVGProps) {
  const tiles = useMemo(() => generateTiles(tileCount), [tileCount]);
  const outlinePath = useMemo(() => heartOutlinePath(), []);

  return (
    <motion.svg
      animate={{ scale: [1, 1.005, 1] }}
      aria-label="Decorative heart mosaic composed of glowing tiles"
      className={className}
      role="img"
      transition={{
        duration: 1.2,
        ease: [0.4, 0, 0.2, 1],
        repeat: Infinity,
      }}
      viewBox="-20 -20 40 40"
    >
      {showOutline && (
        <path
          d={outlinePath}
          fill="none"
          opacity={0.3}
          stroke="var(--color-border)"
          strokeWidth={0.25}
        />
      )}

      {tiles.map((tile, i) => (
        <motion.circle
          animate="visible"
          custom={tile.delay}
          cx={tile.cx}
          cy={tile.cy}
          fill={tile.color}
          initial="hidden"
          key={i}
          opacity={tile.opacity}
          r={tile.r}
          variants={tileVariants}
        >
          <animate
            attributeName="opacity"
            begin={`${r4(tile.delay + 1)}s`}
            dur={`${2 + (i % 3)}s`}
            repeatCount="indefinite"
            values={`${tile.opacity};${r4(tile.opacity * 0.7)};${tile.opacity}`}
          />
        </motion.circle>
      ))}
    </motion.svg>
  );
}
