import type { MosaicStats, MosaicTileMetadata } from "@onerhythm/types";

const API_BASE_URL = process.env.ONERHYTHM_API_BASE_URL ?? "http://127.0.0.1:8000";
const FETCH_TIMEOUT_MS = 2000;

export type HomepageMosaicData = {
  fetch_state: "ready" | "empty" | "degraded";
  stats: MosaicStats;
  tiles: MosaicTileMetadata[];
};

const EMPTY_MOSAIC: HomepageMosaicData = {
  stats: {
    total_tiles: 0,
    public_tiles: 0,
    render_tile_limit: 45,
    has_more_public_tiles: false,
    visible_condition_categories: [],
  },
  tiles: [],
  fetch_state: "empty",
};

function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  return Promise.race([
    fetch(url, { cache: "no-store", signal: controller.signal }),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error("fetch timeout"));
      }, ms);
    }),
  ]);
}

export async function getHomepageMosaicData(): Promise<HomepageMosaicData> {
  try {
    const [statsResult, tilesResult] = await Promise.allSettled([
      fetchWithTimeout(`${API_BASE_URL}/v1/mosaic/stats`, FETCH_TIMEOUT_MS),
      fetchWithTimeout(`${API_BASE_URL}/v1/mosaic/tiles?limit=45`, FETCH_TIMEOUT_MS),
    ]);

    const statsResponse = statsResult.status === "fulfilled" ? statsResult.value : null;
    const tilesResponse = tilesResult.status === "fulfilled" ? tilesResult.value : null;
    const statsOk = Boolean(statsResponse?.ok);
    const tilesOk = Boolean(tilesResponse?.ok);

    if (!statsOk && !tilesOk) {
      return { ...EMPTY_MOSAIC, fetch_state: "degraded" };
    }

    const stats = statsOk ? ((await statsResponse!.json()) as MosaicStats) : EMPTY_MOSAIC.stats;
    const tiles = tilesOk ? ((await tilesResponse!.json()) as MosaicTileMetadata[]) : [];
    const fetch_state =
      !statsOk || !tilesOk ? "degraded" : stats.public_tiles === 0 ? "empty" : "ready";

    return { stats, tiles, fetch_state };
  } catch {
    return { ...EMPTY_MOSAIC, fetch_state: "degraded" };
  }
}
