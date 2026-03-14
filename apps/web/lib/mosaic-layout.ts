import type { MosaicTileMetadata } from "@onerhythm/types";

export type MosaicTone = MosaicTileMetadata["visual_style"]["color_family"];

export type PlacedMosaicTile = {
  column: number;
  id: string;
  opacity: number;
  row: number;
  rotation: number;
  size: "sm" | "md" | "lg";
  tone: MosaicTone;
};

const HEART_SLOTS = [
  [1, 3], [1, 4], [1, 7], [1, 8],
  [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8],
  [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9],
  [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9],
  [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8],
  [6, 3], [6, 4], [6, 5], [6, 6], [6, 7],
  [7, 4], [7, 5], [7, 6],
  [8, 5],
] as const;

function hashTileId(tileId: string): number {
  let hash = 0;
  for (let index = 0; index < tileId.length; index += 1) {
    hash = (hash * 31 + tileId.charCodeAt(index)) % 1000003;
  }
  return hash;
}

function deriveTileSize(tile: MosaicTileMetadata): "sm" | "md" | "lg" {
  const opacity = tile.visual_style.opacity;
  if (tile.visual_style.glow_level === "bright" || opacity >= 0.9) {
    return "lg";
  }
  if (opacity >= 0.76) {
    return "md";
  }
  return "sm";
}

export function placeMosaicTiles(tiles: MosaicTileMetadata[]): PlacedMosaicTile[] {
  return [...tiles]
    .sort((left, right) => {
      const dateDelta = Date.parse(right.contributed_at) - Date.parse(left.contributed_at);
      if (dateDelta !== 0) {
        return dateDelta;
      }
      return left.tile_id.localeCompare(right.tile_id);
    })
    .slice(0, HEART_SLOTS.length)
    .map((tile, index) => {
      const [row, column] = HEART_SLOTS[index];
      const hash = hashTileId(tile.tile_id);

      return {
        id: tile.tile_id,
        row,
        column,
        tone: tile.visual_style.color_family,
        opacity: tile.visual_style.opacity,
        size: deriveTileSize(tile),
        rotation: (hash % 5) - 2,
      };
    });
}
