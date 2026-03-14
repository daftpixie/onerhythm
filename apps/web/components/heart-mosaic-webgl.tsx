"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { MosaicTileMetadata } from "@onerhythm/types";

/* ------------------------------------------------------------------ */
/*  Parametric heart curve — generates (x, y) points on a heart shape */
/* ------------------------------------------------------------------ */

function heartPoint(t: number, scale: number): [number, number] {
  // Classic heart parametric equations
  const x = scale * 16 * Math.pow(Math.sin(t), 3);
  const y =
    scale *
    (13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t));
  return [x, y];
}

function isInsideHeart(px: number, py: number, scale: number): boolean {
  // Sample many points on the heart boundary to do a winding-number test
  // Simplified: use the implicit heart equation
  const x = px / scale;
  const y = py / scale;
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y < 0;
}

/* ------------------------------------------------------------------ */
/*  Generate tile positions inside the heart using spiral placement    */
/* ------------------------------------------------------------------ */

type TilePosition = {
  x: number;
  y: number;
  scale: number;
};

function generateTilePositions(count: number, heartScale: number): TilePosition[] {
  const positions: TilePosition[] = [];
  const tileSize = heartScale * 0.085;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  // Spiral from center outward
  for (let i = 0; positions.length < count && i < count * 8; i++) {
    const r = Math.sqrt(i / (count * 2.5)) * heartScale * 14;
    const theta = i * goldenAngle;
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta) + heartScale * 2; // offset up into heart center

    if (isInsideHeart(x, y, heartScale * 16)) {
      // Check no overlap with existing tiles
      const tooClose = positions.some(
        (p) => Math.hypot(p.x - x, p.y - y) < tileSize * 1.3
      );
      if (!tooClose) {
        positions.push({ x, y, scale: tileSize });
      }
    }
  }

  return positions;
}

/* ------------------------------------------------------------------ */
/*  Color mapping from tile metadata                                   */
/* ------------------------------------------------------------------ */

const TONE_COLORS: Record<string, THREE.Color> = {
  pulse: new THREE.Color(0xff2d55),
  signal: new THREE.Color(0x00d4ff),
  aurora: new THREE.Color(0x7c3aed),
};

function tileColor(tile: MosaicTileMetadata): THREE.Color {
  return TONE_COLORS[tile.visual_style.color_family] ?? TONE_COLORS.signal;
}

/* ------------------------------------------------------------------ */
/*  Single tile mesh                                                   */
/* ------------------------------------------------------------------ */

type TileMeshProps = {
  tile: MosaicTileMetadata;
  position: TilePosition;
  index: number;
  isActive: boolean;
  onActivate: (id: string) => void;
};

function TileMesh({ tile, position, index, isActive, onActivate }: TileMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const color = useMemo(() => tileColor(tile), [tile]);
  const entryDelay = index * 0.02;
  const entryProgress = useRef(0);
  const hoverScale = useRef(1);
  const targetHoverScale = useRef(1);

  useFrame((_, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // Entry animation
    if (entryProgress.current < 1) {
      entryProgress.current = Math.min(1, entryProgress.current + delta / 0.5);
    }
    const t = Math.max(0, (entryProgress.current - entryDelay) / (1 - entryDelay));
    const easedT = t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3);

    // Hover spring
    hoverScale.current += (targetHoverScale.current - hoverScale.current) * Math.min(1, delta * 12);

    const s = position.scale * easedT * hoverScale.current;
    meshRef.current.scale.set(s, s, 1);
    meshRef.current.position.set(position.x, position.y, isActive ? 0.1 : 0);

    // Opacity
    materialRef.current.opacity = tile.visual_style.opacity * easedT;

    // Glow via emissive intensity
    if (isActive) {
      materialRef.current.color.copy(color).lerp(new THREE.Color(0xffffff), 0.15);
    } else {
      materialRef.current.color.copy(color);
    }
  });

  const handlePointerOver = useCallback(() => {
    targetHoverScale.current = 1.2;
    onActivate(tile.tile_id);
    document.body.style.cursor = "pointer";
  }, [onActivate, tile.tile_id]);

  const handlePointerOut = useCallback(() => {
    targetHoverScale.current = 1;
    document.body.style.cursor = "";
  }, []);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onActivate(tile.tile_id);
    },
    [onActivate, tile.tile_id]
  );

  return (
    <mesh
      onClick={handleClick}
      onPointerOut={handlePointerOut}
      onPointerOver={handlePointerOver}
      position={[position.x, position.y, 0]}
      ref={meshRef}
    >
      <circleGeometry args={[1, 24]} />
      <meshBasicMaterial
        color={color}
        opacity={tile.visual_style.opacity}
        ref={materialRef}
        transparent
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Heart outline wireframe                                            */
/* ------------------------------------------------------------------ */

function HeartOutline({ scale }: { scale: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const pulsePhase = useRef(0);
  const lineObjRef = useRef<THREE.Line | null>(null);

  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const steps = 128;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 2 * Math.PI;
      const [x, y] = heartPoint(t, scale);
      pts.push(new THREE.Vector3(x, y, -0.1));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [scale]);

  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color: 0x374151, opacity: 0.2, transparent: true }),
    []
  );

  useEffect(() => {
    if (!groupRef.current) return;
    const lineObj = new THREE.Line(geometry, material);
    lineObjRef.current = lineObj;
    groupRef.current.add(lineObj);
    return () => {
      groupRef.current?.remove(lineObj);
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    if (!lineObjRef.current) return;
    pulsePhase.current += delta;
    const pulse = 0.15 + 0.1 * Math.sin((pulsePhase.current / 1.2) * Math.PI * 2);
    (lineObjRef.current.material as THREE.LineBasicMaterial).opacity = pulse;
  });

  return <group ref={groupRef} />;
}

/* ------------------------------------------------------------------ */
/*  Ambient glow particles                                             */
/* ------------------------------------------------------------------ */

function AmbientGlow({ scale }: { scale: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const geometry = useMemo(() => {
    const count = 60;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Random positions inside the heart
      let x: number, y: number;
      do {
        x = (Math.random() - 0.5) * scale * 34;
        y = (Math.random() - 0.3) * scale * 30;
      } while (!isInsideHeart(x, y, scale * 16));
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = -0.05;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [scale]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.z += delta * 0.01;
  });

  return (
    <points geometry={geometry} ref={pointsRef}>
      <pointsMaterial
        color={0x00d4ff}
        opacity={0.12}
        ref={materialRef}
        size={scale * 0.6}
        sizeAttenuation
        transparent
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/*  Camera setup                                                       */
/* ------------------------------------------------------------------ */

function CameraSetup({ scale }: { scale: number }) {
  const { camera } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      const extent = scale * 20;
      camera.left = -extent;
      camera.right = extent;
      camera.top = extent;
      camera.bottom = -extent;
      camera.near = -10;
      camera.far = 10;
      camera.updateProjectionMatrix();
    }
  }, [camera, scale]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  Main WebGL mosaic scene                                            */
/* ------------------------------------------------------------------ */

type HeartMosaicSceneProps = {
  tiles: MosaicTileMetadata[];
  activeTileId: string | null;
  onActivate: (id: string) => void;
};

function HeartMosaicScene({ tiles, activeTileId, onActivate }: HeartMosaicSceneProps) {
  const scale = 1;
  const positions = useMemo(
    () => generateTilePositions(tiles.length, scale),
    [tiles.length, scale]
  );

  return (
    <>
      <CameraSetup scale={scale} />
      <HeartOutline scale={scale} />
      <AmbientGlow scale={scale} />
      {tiles.slice(0, positions.length).map((tile, index) => (
        <TileMesh
          index={index}
          isActive={activeTileId === tile.tile_id}
          key={tile.tile_id}
          onActivate={onActivate}
          position={positions[index]}
          tile={tile}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported canvas wrapper                                            */
/* ------------------------------------------------------------------ */

type HeartMosaicCanvasProps = {
  tiles: MosaicTileMetadata[];
  activeTileId: string | null;
  onActivate: (id: string) => void;
  className?: string;
};

export function HeartMosaicCanvas({
  tiles,
  activeTileId,
  onActivate,
  className,
}: HeartMosaicCanvasProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={`flex items-center justify-center ${className ?? ""}`}
      >
        <div className="animate-pulse text-sm text-text-tertiary">
          Loading mosaic...
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={className}>
      <Canvas
        camera={{ position: [0, 0, 5] }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        orthographic
        style={{ background: "transparent" }}
      >
        <HeartMosaicScene
          activeTileId={activeTileId}
          onActivate={onActivate}
          tiles={tiles}
        />
      </Canvas>
    </div>
  );
}
