"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";

import type { MosaicStats, MosaicTileMetadata } from "@onerhythm/types";

import { HeartMosaicCanvas } from "./heart-mosaic-webgl";
import { trackSurfaceVisit } from "../lib/analytics";
import { placeMosaicTiles } from "../lib/mosaic-layout";

type HeartMosaicProps = {
  fetchState: "ready" | "empty" | "degraded";
  stats: MosaicStats;
  tiles: MosaicTileMetadata[];
};

const toneClasses = {
  pulse: "bg-pulse",
  signal: "bg-signal",
  aurora: "bg-aurora",
} as const;

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
} as const;

const textureClasses = {
  smooth: "mosaic-texture-smooth",
  grain: "mosaic-texture-grain",
  ripple: "mosaic-texture-ripple",
} as const;

const glowClasses = {
  none: "mosaic-glow-none",
  subtle: "mosaic-glow-subtle",
  bright: "mosaic-glow-bright",
} as const;

const conditionLabels: Record<MosaicTileMetadata["condition_category"], string> = {
  arvc: "ARVC",
  afib: "Atrial fibrillation",
  vt: "Ventricular tachycardia",
  svt: "Supraventricular tachycardia",
  long_qt: "Long QT syndrome",
  brugada: "Brugada syndrome",
  wpw: "Wolff-Parkinson-White",
  other: "Another self-reported rhythm condition",
};

function formatLatestContribution(latestContributionAt?: string): string {
  if (!latestContributionAt) {
    return "No public contributions yet.";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(latestContributionAt));
}

function formatContributionDate(contributedAt: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(contributedAt));
}

export function HeartMosaic({ fetchState, stats, tiles }: HeartMosaicProps) {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState("");
  const visibleTiles = useMemo(
    () => tiles.slice(0, stats.render_tile_limit),
    [stats.render_tile_limit, tiles],
  );
  const placedTiles = useMemo(() => placeMosaicTiles(visibleTiles), [visibleTiles]);
  const conditionCount = stats.visible_condition_categories.length;
  const latestContribution = formatLatestContribution(stats.latest_contribution_at);
  const [activeTileId, setActiveTileId] = useState<string | null>(placedTiles[0]?.id ?? null);

  const tileLookup = useMemo(
    () => new Map(visibleTiles.map((tile) => [tile.tile_id, tile])),
    [visibleTiles],
  );
  const contributionCounts = useMemo(() => {
    return visibleTiles.reduce<Record<string, number>>((counts, tile) => {
      counts[tile.condition_category] = (counts[tile.condition_category] ?? 0) + 1;
      return counts;
    }, {});
  }, [visibleTiles]);
  const activeTile = activeTileId ? tileLookup.get(activeTileId) ?? null : null;
  const activeConditionCount = activeTile
    ? contributionCounts[activeTile.condition_category] ?? 0
    : 0;
  const visibleTileCount = placedTiles.length;
  const summaryText =
    fetchState === "degraded"
      ? "The public heart mosaic summary is temporarily unavailable. Try again soon."
      : fetchState === "empty"
        ? "The public heart mosaic is ready for its first contribution."
        : `${stats.public_tiles.toLocaleString()} public contributions arranged across ${conditionCount.toLocaleString()} visible condition groups. Latest visible contribution: ${latestContribution}.`;

  useEffect(() => {
    if (!pathname || fetchState === "degraded") {
      return;
    }

    trackSurfaceVisit({
      surface: "heart_mosaic",
      path: pathname,
      viewedEvent: "heart_mosaic_viewed",
      returnedEvent: "heart_mosaic_returned",
      properties: {
        content_kind: "mosaic",
        status: fetchState,
      },
    });
  }, [fetchState, pathname]);

  useEffect(() => {
    if (fetchState === "degraded") {
      setAnnouncement("The public heart mosaic is temporarily unavailable.");
      return;
    }

    if (stats.public_tiles === 0) {
      setAnnouncement("The public heart mosaic is ready for its first contribution.");
      return;
    }

    setAnnouncement(
      `Showing ${visibleTileCount} public heart mosaic tiles across ${conditionCount} condition groups.`,
    );
  }, [conditionCount, fetchState, stats.public_tiles, visibleTileCount]);

  useEffect(() => {
    if (!activeTile || fetchState !== "ready") {
      return;
    }

    setAnnouncement(
      `${conditionLabels[activeTile.condition_category]}. Contribution date ${formatContributionDate(activeTile.contributed_at)}. ${activeConditionCount} visible contributions in this condition group.`,
    );
  }, [activeConditionCount, activeTile, fetchState]);

  useEffect(() => {
    setActiveTileId(placedTiles[0]?.id ?? null);
  }, [placedTiles]);

  function focusTileByOffset(currentId: string, offset: number) {
    const currentIndex = placedTiles.findIndex((tile) => tile.id === currentId);
    if (currentIndex === -1) {
      return;
    }

    const nextIndex = (currentIndex + offset + placedTiles.length) % placedTiles.length;
    setActiveTileId(placedTiles[nextIndex]?.id ?? currentId);
  }

  function handleTileKeyDown(event: KeyboardEvent<HTMLButtonElement>, tileId: string) {
    if (placedTiles.length === 0) {
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusTileByOffset(tileId, 1);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTileByOffset(tileId, -1);
    }
  }

  return (
    <section
      aria-labelledby="mosaic-heading"
      className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
    >
      <div className="surface-2 relative overflow-hidden rounded-[2rem] border border-token p-6 shadow-surface">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-aurora opacity-10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-12 top-10 h-40 rounded-full bg-signal opacity-10 blur-3xl"
        />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
              Heart Mosaic
            </p>
            <h2
              className="max-w-2xl font-display text-3xl text-text-primary sm:text-4xl"
              id="mosaic-heading"
            >
              A public constellation of rhythm, care, and shared presence.
            </h2>
            <p className="max-w-xl text-base leading-7 text-text-secondary">
              Each tile reflects a de-identified contribution already stored in
              the mosaic. The composition is artistic, communal, and warm by
              design. It does not present clinical findings or ECG analysis.
            </p>
            {fetchState === "degraded" ? (
              <p className="rounded-xl border border-pulse/40 bg-pulse/10 px-4 py-3 text-sm leading-6 text-text-secondary">
                The live mosaic feed is temporarily unavailable. Public privacy
                boundaries remain unchanged, and the page will show fresh data
                again when the feed recovers.
              </p>
            ) : null}
          </div>
          <div className="hidden rounded-full border border-token px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-text-secondary sm:block">
            {fetchState === "ready" ? "Live metadata" : "Public status"}
          </div>
        </div>

        <figure className="relative mt-8">
          {fetchState === "degraded" ? (
            <div className="mosaic-frame flex min-h-[28rem] items-center justify-center rounded-[1.75rem] border border-dashed border-token px-6 text-center">
              <div className="max-w-md space-y-3">
                <p className="font-display text-2xl text-text-primary">
                  The public mosaic is resting for a moment.
                </p>
                <p className="text-sm leading-7 text-text-secondary">
                  The shared heart will return as soon as public tile metadata is
                  available again. No raw uploads or personal records are exposed
                  through this public view.
                </p>
              </div>
            </div>
          ) : fetchState === "empty" ? (
            <div className="mosaic-frame flex min-h-[28rem] items-center justify-center rounded-[1.75rem] border border-token px-6 text-center">
              <div className="max-w-md space-y-3">
                <p className="font-display text-2xl text-text-primary">
                  Waiting for the first shared tile.
                </p>
                <p className="text-sm leading-7 text-text-secondary">
                  When the first consented contribution arrives, the public heart
                  will begin to take shape here.
                </p>
              </div>
            </div>
          ) : (
            <>
              <HeartMosaicCanvas
                activeTileId={activeTileId}
                className="mosaic-frame hidden min-h-[30rem] overflow-hidden rounded-[1.75rem] lg:block"
                onActivate={setActiveTileId}
                tiles={visibleTiles}
              />

              <div
                className="grid grid-cols-7 gap-2 lg:hidden"
                role="list"
                aria-label="Public heart mosaic tiles"
              >
                {placedTiles.slice(0, 28).map((tile) => (
                  <button
                    aria-describedby="mosaic-tile-detail"
                    aria-label={`${conditionLabels[tileLookup.get(tile.id)?.condition_category ?? "other"]}, contributed ${formatContributionDate(tileLookup.get(tile.id)?.contributed_at ?? new Date().toISOString())}`}
                    aria-pressed={activeTileId === tile.id}
                    className={[
                      "rounded-xl border border-token p-3 transition-transform duration-micro ease-out focus-visible:scale-105",
                      activeTileId === tile.id ? "ring-signal scale-105" : "",
                      toneClasses[tile.tone],
                      textureClasses[tileLookup.get(tile.id)?.visual_style.texture_kind ?? "smooth"],
                      glowClasses[tileLookup.get(tile.id)?.visual_style.glow_level ?? "none"],
                    ].join(" ")}
                    key={`fallback-${tile.id}`}
                    onClick={() => setActiveTileId(tile.id)}
                    onFocus={() => setActiveTileId(tile.id)}
                    onKeyDown={(event) => handleTileKeyDown(event, tile.id)}
                    onMouseEnter={() => setActiveTileId(tile.id)}
                    type="button"
                    style={{ opacity: tile.opacity }}
                  />
                ))}
              </div>
            </>
          )}

          <figcaption className="mt-5 text-sm leading-6 text-text-secondary">
            {fetchState === "ready"
              ? `Larger screens use a deterministic heart layout from stored tile metadata. Smaller screens fall back to a simpler 2D grid. Showing ${visibleTileCount.toLocaleString()} tiles now${stats.has_more_public_tiles ? `, with more public tiles already stored beyond this launch view.` : "."}`
              : "The public mosaic keeps the same privacy boundary even when the visual layer is empty or temporarily unavailable."}
          </figcaption>
        </figure>

        <div aria-atomic="true" aria-live="polite" className="sr-only" role="status">
          {announcement}
        </div>
        <div className="sr-only" role="img">
          {summaryText}
        </div>
      </div>

      <div className="space-y-6">
        <div className="surface-2 rounded-[2rem] border border-token p-6 shadow-surface">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Text alternative
          </p>
          <dl className="mt-5 grid gap-4">
            <div>
              <dt className="text-sm font-medium text-text-primary">
                Public contributions
              </dt>
              <dd className="mt-1 text-sm leading-6 text-text-secondary">
                {fetchState === "degraded"
                  ? "Public mosaic metadata is temporarily unavailable."
                  : `${stats.public_tiles.toLocaleString()} visible tiles from ${conditionCount.toLocaleString()} condition groups.`}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-primary">
                Latest visible contribution
              </dt>
              <dd className="mt-1 text-sm leading-6 text-text-secondary">
                {latestContribution}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-primary">
                What the visual means
              </dt>
              <dd className="mt-1 text-sm leading-6 text-text-secondary">
                The mosaic is a public signal of shared experience and collective
                visibility. It does not expose identity, uploaded source files,
                or clinical conclusions.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-primary">
                Launch rendering scope
              </dt>
              <dd className="mt-1 text-sm leading-6 text-text-secondary">
                {fetchState === "ready"
                  ? `This homepage renders up to ${stats.render_tile_limit.toLocaleString()} tiles for stable public performance today.`
                  : "The homepage will return to its normal render window once live public data is available."}
              </dd>
            </div>
          </dl>
        </div>

        <div className="surface-2 rounded-[2rem] border border-token p-6 shadow-surface">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            Tile detail
          </p>
          {fetchState === "degraded" ? (
            <p className="mt-4 text-base leading-7 text-text-secondary" id="mosaic-tile-detail">
              Tile detail will return with the live public feed.
            </p>
          ) : activeTile ? (
            <div className="mt-4 space-y-4" id="mosaic-tile-detail">
              <p className="text-base leading-7 text-text-secondary">
                A small light within a larger living shape. Public enough to
                belong, restrained enough to protect the person behind it.
              </p>
              <dl className="grid gap-4">
                <div>
                  <dt className="text-sm font-medium text-text-primary">
                    Contribution date
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-text-secondary">
                    {formatContributionDate(activeTile.contributed_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-primary">
                    Self-reported condition category
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-text-secondary">
                    {conditionLabels[activeTile.condition_category]}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-text-primary">
                    Condition contribution count
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-text-secondary">
                    {activeConditionCount.toLocaleString()} visible contributions
                    share this condition group.
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="mt-4 text-base leading-7 text-text-secondary" id="mosaic-tile-detail">
              Choose a tile to see its public detail.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
