import type { CSSProperties } from "react";

type LandingMosaicPreviewProps = {
  tileCount?: number;
  className?: string;
};

type Tile = {
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity: number;
  delay: number;
};

const TILE_COLORS = [
  "#ff2d55",
  "#ff2d55",
  "#ff6b8a",
  "#00d4ff",
  "#66e5ff",
  "#7c3aed",
  "#a78bfa",
] as const;

function heartX(t: number): number {
  return 16 * Math.pow(Math.sin(t), 3);
}

function heartY(t: number): number {
  return 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
}

function heartOutlinePath(): string {
  const steps = 120;
  let d = "";
  for (let index = 0; index <= steps; index += 1) {
    const t = (index / steps) * 2 * Math.PI;
    const x = heartX(t);
    const y = -heartY(t);
    d += index === 0 ? `M${x.toFixed(2)},${y.toFixed(2)}` : `L${x.toFixed(2)},${y.toFixed(2)}`;
  }
  return `${d}Z`;
}

function isInsideHeart(px: number, py: number): boolean {
  const x = px / 16;
  const y = py / 16;
  const base = x * x + y * y - 1;
  return base * base * base - x * x * y * y * y < 0;
}

function roundTo4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function generateTiles(count: number): Tile[] {
  const tiles: Tile[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  function seeded(index: number): number {
    return ((index * 2654435761) >>> 0) / 4294967296;
  }

  for (let index = 0; tiles.length < count && index < count * 10; index += 1) {
    const radius = Math.sqrt(index / (count * 1.25)) * 8.2;
    const theta = index * goldenAngle;
    const x = radius * Math.cos(theta);
    const y = -(radius * Math.sin(theta) + 1.2);

    if (!isInsideHeart(x, -y)) {
      continue;
    }

    const distance = Math.sqrt(x * x + (y + 1.2) * (y + 1.2));
    const normalized = Math.min(distance / 8.5, 1);
    const tileRadius = 0.58 + (1 - normalized) * 0.5;
    const opacity = 0.42 + (1 - normalized) * 0.45;
    const overlapping = tiles.some(
      (tile) => Math.hypot(tile.cx - x, tile.cy - y) < (tile.r + tileRadius) * 1.3,
    );

    if (overlapping) {
      continue;
    }

    tiles.push({
      cx: roundTo4(x),
      cy: roundTo4(y),
      r: roundTo4(tileRadius),
      color: TILE_COLORS[Math.floor(seeded(index) * TILE_COLORS.length)] ?? TILE_COLORS[0],
      opacity: roundTo4(opacity),
      delay: roundTo4(tiles.length * 0.12),
    });
  }

  return tiles;
}

export function LandingMosaicPreview({
  tileCount = 18,
  className = "",
}: LandingMosaicPreviewProps) {
  const tiles = generateTiles(tileCount);
  const outlinePath = heartOutlinePath();

  return (
    <figure
      className={[
        "relative overflow-hidden rounded-[2rem] border border-token bg-[linear-gradient(180deg,rgba(26,31,53,0.96),rgba(17,24,39,0.94))] p-6 shadow-panel",
        className,
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,45,85,0.18),transparent_48%),radial-gradient(circle_at_50%_62%,rgba(124,58,237,0.18),transparent_52%)]"
      />
      <svg
        aria-describedby="landing-mosaic-caption"
        aria-label="Preview of the Heart Mosaic in its early state"
        className="landing-mosaic-heart relative z-10 mx-auto w-full max-w-[22rem]"
        role="img"
        viewBox="-20 -20 40 40"
      >
        <defs>
          <filter id="landing-heart-glow">
            <feGaussianBlur result="blur" stdDeviation="1.2" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          className="landing-heart-outline landing-motion-safe"
          d={outlinePath}
          fill="none"
          filter="url(#landing-heart-glow)"
          stroke="rgba(249,250,251,0.28)"
          strokeWidth={0.3}
        />
        {tiles.map((tile, index) => (
          <circle
            className="landing-heart-tile landing-motion-safe"
            cx={tile.cx}
            cy={tile.cy}
            fill={tile.color}
            filter="url(#landing-heart-glow)"
            key={`${tile.cx}-${tile.cy}-${index}`}
            opacity={tile.opacity}
            r={tile.r}
            style={
              {
                "--tile-delay": `${tile.delay}s`,
                "--tile-opacity": tile.opacity,
              } as CSSProperties
            }
          />
        ))}
      </svg>
      <figcaption
        className="relative z-10 mt-4 text-xs uppercase tracking-[0.16em] text-text-secondary"
        id="landing-mosaic-caption"
      >
        Every de-identified ECG contribution becomes a tile. Every tile is a story.
        Every story fights the silence.
      </figcaption>
    </figure>
  );
}
