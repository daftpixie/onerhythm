"use client";

import { Html, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Heart, Moon } from "lucide-react";
import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import type {
  MissionOverview,
  MissionRouteGeometry,
  MissionScenePerformanceTier,
  MissionSegmentsWindow,
} from "@onerhythm/types";

import {
  buildMissionMilestoneRenderStates,
  buildMissionRoutePolyline,
  buildProgressRoutePolylineFromAggregate,
  buildRemainingRoutePolylineFromAggregate,
  getMissionAggregateRouteProgress,
  getMissionSceneTierConfig,
  getMissionRouteProgress,
  getMissionWaypointByKey,
  paletteKeyToSceneColor,
} from "../../lib/mission-v3-scene";

type MissionSceneWindowSet = {
  recent: MissionSegmentsWindow;
  nearProgress: MissionSegmentsWindow;
  milestoneLocal: MissionSegmentsWindow;
  countryHighlights: MissionSegmentsWindow;
};

type MissionControlSceneProps = {
  detailMode: "balanced" | "conservative";
  focusedWaypointKey: string | null;
  inspectMode: boolean;
  onSceneLoaded?: (payload: {
    fpsEstimate: number;
    performanceTier: MissionScenePerformanceTier;
  }) => void;
  overview: MissionOverview;
  reducedMotion: boolean;
  routeGeometry: MissionRouteGeometry;
  segmentsWindows: MissionSceneWindowSet;
};

function toThreeVector(point: { x: number; y: number; z: number }) {
  return new THREE.Vector3(point.x, point.y, point.z);
}

function toEarthLatLonVectorNegativeZ(latitudeDegrees: number, longitudeDegrees: number) {
  const latitudeRadians = THREE.MathUtils.degToRad(latitudeDegrees);
  const longitudeRadians = THREE.MathUtils.degToRad(longitudeDegrees);
  const radiusAtLatitude = Math.cos(latitudeRadians);

  return new THREE.Vector3(
    radiusAtLatitude * Math.cos(longitudeRadians),
    Math.sin(latitudeRadians),
    -radiusAtLatitude * Math.sin(longitudeRadians),
  );
}

function projectVectorOntoPlane(vector: THREE.Vector3, normal: THREE.Vector3) {
  return vector.clone().sub(normal.clone().multiplyScalar(vector.dot(normal)));
}

function buildEarthTextureAlignmentQuaternion(routeGeometry: MissionRouteGeometry) {
  const tampaWaypoint = getMissionWaypointByKey(routeGeometry, "tampa");
  const capeWaypoint = getMissionWaypointByKey(routeGeometry, "cape_canaveral");

  if (!tampaWaypoint || !capeWaypoint) {
    return new THREE.Quaternion();
  }

  const tampaLatitude = tampaWaypoint.latitude_degrees;
  const tampaLongitude = tampaWaypoint.longitude_degrees;
  const capeLatitude = capeWaypoint.latitude_degrees;
  const capeLongitude = capeWaypoint.longitude_degrees;

  if (
    tampaLatitude === null ||
    tampaLatitude === undefined ||
    tampaLongitude === null ||
    tampaLongitude === undefined ||
    capeLatitude === null ||
    capeLatitude === undefined ||
    capeLongitude === null ||
    capeLongitude === undefined
  ) {
    return new THREE.Quaternion();
  }

  const routeTampaVector = toThreeVector(tampaWaypoint.position).normalize();
  const routeCapeVector = toThreeVector(capeWaypoint.position).normalize();
  const standardTampaVector = toEarthLatLonVectorNegativeZ(
    tampaLatitude,
    tampaLongitude,
  ).normalize();
  const standardCapeVector = toEarthLatLonVectorNegativeZ(
    capeLatitude,
    capeLongitude,
  ).normalize();
  const baseQuaternion = new THREE.Quaternion().setFromUnitVectors(
    standardTampaVector,
    routeTampaVector,
  );
  const rotatedCapeVector = standardCapeVector.clone().applyQuaternion(baseQuaternion);
  const projectedRouteCapeVector = projectVectorOntoPlane(routeCapeVector, routeTampaVector);
  const projectedRotatedCapeVector = projectVectorOntoPlane(rotatedCapeVector, routeTampaVector);

  if (
    projectedRouteCapeVector.lengthSq() <= 1e-6 ||
    projectedRotatedCapeVector.lengthSq() <= 1e-6
  ) {
    return baseQuaternion;
  }

  projectedRouteCapeVector.normalize();
  projectedRotatedCapeVector.normalize();
  const angle = projectedRotatedCapeVector.angleTo(projectedRouteCapeVector);
  const cross = new THREE.Vector3().crossVectors(
    projectedRotatedCapeVector,
    projectedRouteCapeVector,
  );
  const signedAngle = angle * (cross.dot(routeTampaVector) < 0 ? -1 : 1);
  const rollQuaternion = new THREE.Quaternion().setFromAxisAngle(
    routeTampaVector,
    signedAngle,
  );

  return baseQuaternion.clone().premultiply(rollQuaternion);
}

function buildCurve(points: Array<{ x: number; y: number; z: number }>) {
  return new THREE.CatmullRomCurve3(points.map(toThreeVector), false, "catmullrom", 0.3);
}

function smoothstep(min: number, max: number, value: number) {
  const t = THREE.MathUtils.clamp((value - min) / Math.max(max - min, 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}

function buildCurveMap(routeGeometry: MissionRouteGeometry) {
  return new Map(routeGeometry.legs.map((leg) => [leg.key, buildCurve(leg.points)]));
}

const EARTH_BASE_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}`;

const EARTH_BASE_FRAGMENT_SHADER = `
uniform sampler2D topologyMap;
uniform sampler2D nightMap;
uniform vec3 oceanColorA;
uniform vec3 oceanColorB;
uniform vec3 landColorA;
uniform vec3 landColorB;
uniform vec3 cityLightColor;
uniform vec3 signalCyan;
uniform vec3 auroraViolet;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

float saturateValue(float value) {
  return clamp(value, 0.0, 1.0);
}

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float topo = texture2D(topologyMap, vUv).r;
  vec3 night = texture2D(nightMap, vUv).rgb;
  float mapLuma = dot(night, vec3(0.2126, 0.7152, 0.0722));
  float latitude = abs(vUv.y - 0.5) * 2.0;

  float landMask = smoothstep(0.012, 0.038, topo);
  float ridgeMask = smoothstep(0.2, 0.62, topo);
  float coastMask = smoothstep(0.008, 0.03, topo) - smoothstep(0.03, 0.07, topo);
  float cityMask = smoothstep(0.1, 0.38, max(max(night.r, night.g), night.b)) * landMask;
  float cityCoreMask = smoothstep(0.22, 0.58, max(max(night.r, night.g), night.b)) * landMask;
  float seaEnergy = saturateValue(night.b * 0.62 + mapLuma * 0.28);

  vec3 ocean = mix(
    oceanColorA,
    oceanColorB,
    seaEnergy
  );
  vec3 land = mix(landColorA, landColorB, saturateValue(ridgeMask * 0.8 + mapLuma * 0.34));
  vec3 base = mix(ocean, land, landMask);
  vec3 biolumeLand = mix(
    signalCyan,
    auroraViolet,
    saturateValue(ridgeMask * 0.54 + topo * 0.24 + night.r * 0.12)
  );
  vec3 snowColor = vec3(0.88, 0.93, 0.98);
  vec3 subtleCityGlow = night * vec3(0.42, 0.34, 0.32);

  vec3 lightDir = normalize(vec3(0.58, 0.42, 0.68));
  float diffuse = saturateValue(dot(normal, lightDir));
  float rim = pow(1.0 - saturateValue(dot(normal, viewDir)), 2.8);
  float snowMask = saturateValue(smoothstep(0.74, 0.96, latitude) * 0.74 + ridgeMask * 0.18);
  float landGlow = saturateValue(landMask * 0.28 + ridgeMask * 0.22 + cityMask * 0.44 + coastMask * 0.5);
  float oceanLift = saturateValue(0.14 + seaEnergy * 0.26);

  base = mix(base, snowColor, snowMask * max(landMask, 0.16));
  base = mix(base, biolumeLand, landMask * 0.36);
  base += subtleCityGlow * cityMask * 0.34;
  base += cityLightColor * cityCoreMask * 0.24;
  base += biolumeLand * landGlow * 0.28;
  base += biolumeLand * coastMask * 0.42;
  base += signalCyan * oceanLift * 0.08;
  base += vec3(0.08, 0.12, 0.22) * rim * 0.18;
  base *= 1.02 + diffuse * 0.12;
  base = pow(base, vec3(0.84));

  gl_FragColor = vec4(base, 1.0);
}`;

const EARTH_SIGNAL_FRAGMENT_SHADER = `
uniform sampler2D topologyMap;
uniform sampler2D nightMap;
uniform vec3 signalCyan;
uniform vec3 auroraViolet;
uniform float motionScale;
uniform float time;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

float saturateValue(float value) {
  return clamp(value, 0.0, 1.0);
}

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float topo = texture2D(topologyMap, vUv).r;
  vec3 night = texture2D(nightMap, vUv).rgb;

  float continentMask = smoothstep(0.012, 0.038, topo);
  float cityMask = smoothstep(0.1, 0.34, max(max(night.r, night.g), night.b));
  float contourBand = 1.0 - abs(fract(topo * 26.0 - time * 0.02 * motionScale) - 0.5) * 2.0;
  contourBand = smoothstep(0.78, 0.98, contourBand) * continentMask;
  float meridianBand = 1.0 - abs(fract((vUv.x + time * 0.004 * motionScale) * 18.0) - 0.5) * 2.0;
  meridianBand = smoothstep(0.95, 1.0, meridianBand) * continentMask * 0.12;
  float coastMask = (smoothstep(0.008, 0.03, topo) - smoothstep(0.03, 0.07, topo)) * 0.26;

  float signalMask = max(cityMask * 0.98, contourBand * 0.58 + meridianBand * 1.08 + coastMask * 0.92);
  vec3 signalColor = mix(signalCyan, auroraViolet, smoothstep(0.3, 0.82, topo));
  float rim = pow(1.0 - saturateValue(dot(normal, viewDir)), 2.2);

  vec3 color = signalColor * (signalMask * 1.05 + rim * 0.14);
  float alpha = clamp(signalMask * 0.24 + rim * 0.07, 0.0, 0.34);

  gl_FragColor = vec4(color, alpha);
}`;

const ATMOSPHERE_FRAGMENT_SHADER = `
uniform vec3 signalCyan;
uniform vec3 auroraViolet;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

float saturateValue(float value) {
  return clamp(value, 0.0, 1.0);
}

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - saturateValue(dot(normal, viewDir)), 2.45);
  float polarLift = smoothstep(-0.2, 0.9, normal.y);
  vec3 color = mix(signalCyan, auroraViolet, 0.72);
  color *= mix(0.74, 1.14, polarLift);
  gl_FragColor = vec4(color, fresnel * 0.18);
}`;

const MOON_RIM_FRAGMENT_SHADER = `
uniform vec3 rimColor;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

float saturateValue(float value) {
  return clamp(value, 0.0, 1.0);
}

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - saturateValue(dot(normal, viewDir)), 4.4);
  gl_FragColor = vec4(rimColor, fresnel * 0.12);
}`;

const EARTH_SYSTEM_BASE_ROTATION = new THREE.Euler(0.34, -2.42, 0.04);
const EARTH_INITIAL_VIEW_VECTOR = new THREE.Vector3(4.9, 1.34, 17.2).normalize();
const EARTH_INITIAL_ROLL_OFFSET_RADIANS = 0.08;
const EARTH_CANONICAL_TAMPA_YAW_OFFSET_RADIANS = 1.02;
const TAMPA_FALLBACK_LATITUDE_DEGREES = 27.9506;
const TAMPA_FALLBACK_LONGITUDE_DEGREES = -82.4572;

function MissionBloomComposer({
  detailMode,
  reducedMotion,
}: {
  detailMode: "balanced" | "conservative";
  reducedMotion: boolean;
}) {
  const { camera, gl, scene, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const tier = useMemo(
    () => getMissionSceneTierConfig(detailMode, reducedMotion),
    [detailMode, reducedMotion],
  );

  useEffect(() => {
    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      tier.bloomStrength,
      detailMode === "conservative" ? 0.44 : 0.62,
      0.62,
    );

    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.setSize(size.width, size.height);
    composerRef.current = composer;

    return () => {
      composer.dispose();
      composerRef.current = null;
    };
  }, [camera, detailMode, gl, scene, size.height, size.width, tier.bloomStrength]);

  useFrame(() => {
    composerRef.current?.render();
  }, 1);

  return null;
}

function MissionPerformanceProbe({
  detailMode,
  onSceneLoaded,
  reducedMotion,
}: {
  detailMode: "balanced" | "conservative";
  onSceneLoaded?: (payload: {
    fpsEstimate: number;
    performanceTier: MissionScenePerformanceTier;
  }) => void;
  reducedMotion: boolean;
}) {
  const sentRef = useRef(false);
  const startRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);

  useFrame(({ clock }) => {
    if (sentRef.current) {
      return;
    }

    const elapsed = clock.getElapsedTime();
    if (startRef.current === null) {
      startRef.current = elapsed;
    }
    frameCountRef.current += 1;

    const sampleDuration = elapsed - startRef.current;
    if (sampleDuration < 1.6 && frameCountRef.current < 90) {
      return;
    }

    const fpsEstimate =
      sampleDuration > 0 ? frameCountRef.current / Math.max(sampleDuration, 0.001) : 60;
    let performanceTier: MissionScenePerformanceTier =
      fpsEstimate >= 54 ? "immersive" : fpsEstimate >= 36 ? "balanced" : "conservative";

    if (reducedMotion && performanceTier === "immersive") {
      performanceTier = "balanced";
    }
    if (detailMode === "conservative" && performanceTier === "immersive") {
      performanceTier = "balanced";
    }

    sentRef.current = true;
    onSceneLoaded?.({
      fpsEstimate: Number(fpsEstimate.toFixed(2)),
      performanceTier,
    });
  });

  return null;
}

function MissionCameraRig({
  aggregate,
  focusedWaypointKey,
  inspectMode,
  reducedMotion,
  routeGeometry,
}: {
  aggregate: MissionOverview["aggregate"];
  focusedWaypointKey: string | null;
  inspectMode: boolean;
  reducedMotion: boolean;
  routeGeometry: MissionRouteGeometry;
}) {
  const controlsRef = useRef<{
    target: THREE.Vector3;
    enabled: boolean;
    update: () => void;
    minDistance: number;
    maxDistance: number;
  } | null>(null);
  const { camera } = useThree();

  const progress = getMissionAggregateRouteProgress(aggregate, routeGeometry);
  const focusedWaypoint = getMissionWaypointByKey(routeGeometry, focusedWaypointKey);
  const moonPoint = useMemo(() => toThreeVector(routeGeometry.moon_position), [routeGeometry.moon_position]);
  const defaultTarget = useMemo(() => {
    if (inspectMode && focusedWaypoint) {
      return toThreeVector(focusedWaypoint.position)
        .clone()
        .lerp(moonPoint, focusedWaypoint.key === "moon_distance" ? 0.08 : 0.03);
    }

    if (progress.leg?.key === "cape_to_moon") {
      return new THREE.Vector3(3.82, 0.3, -0.06).lerp(moonPoint, 0.1);
    }

    if (progress.leg?.key === "tampa_to_cape") {
      return new THREE.Vector3(3.6, 0.28, -0.04);
    }

    return new THREE.Vector3(3.5, 0.28, -0.03);
  }, [focusedWaypoint, inspectMode, moonPoint, progress.leg?.key]);
  const defaultPosition = useMemo(() => {
    if (inspectMode && focusedWaypoint?.key === "moon_distance") {
      return new THREE.Vector3(3.62, 1.18, 9.88);
    }

    const earthHero = new THREE.Vector3(4.9, 1.34, 17.2);
    const cislunarBias = new THREE.Vector3(5.6, 1.42, 17.8);
    const moonWeight =
      progress.leg?.key === "cape_to_moon"
        ? Math.min(0.34, 0.12 + Math.max(progress.normalizedProgress - 0.09, 0) * 0.28)
        : progress.leg?.key === "tampa_to_cape"
          ? 0.12
          : 0;

    return earthHero.clone().lerp(cislunarBias, moonWeight);
  }, [focusedWaypoint?.key, inspectMode, progress.leg?.key, progress.normalizedProgress]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    if (!inspectMode) {
      camera.position.lerp(defaultPosition, reducedMotion ? 0.08 : 0.045);
    }
    controls.target.lerp(defaultTarget, inspectMode ? 0.16 : 0.085);
    controls.enabled = inspectMode;
    controls.minDistance = inspectMode ? 4.2 : 7.8;
    controls.maxDistance = inspectMode ? 11.6 : 11.6;
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef as never}
      enableDamping
      enablePan={false}
      enableZoom
      makeDefault
      maxDistance={11.6}
      maxPolarAngle={Math.PI * 0.82}
      minDistance={4.2}
      minPolarAngle={Math.PI * 0.18}
      dampingFactor={0.08}
      rotateSpeed={0.42}
      zoomSpeed={0.62}
    />
  );
}

function EarthFallbackSphere({ radius }: { radius: number }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          color="#07111c"
          emissive="#10233b"
          emissiveIntensity={0.48}
          metalness={0.04}
          roughness={0.88}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.012, 48, 48]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#6be8ff"
          depthWrite={false}
          opacity={0.08}
          transparent
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.016, 64, 64]} />
        <shaderMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fragmentShader={ATMOSPHERE_FRAGMENT_SHADER}
          side={THREE.BackSide}
          toneMapped={false}
          transparent
          uniforms={{
            auroraViolet: { value: new THREE.Color("#8b68ff") },
            signalCyan: { value: new THREE.Color("#63e7ff") },
          }}
          vertexShader={EARTH_BASE_VERTEX_SHADER}
        />
      </mesh>
    </group>
  );
}

function EarthTexturedSphere({
  radius,
  preferCanonicalTampaOrientation,
  reducedMotion,
  routeGeometry,
}: {
  radius: number;
  preferCanonicalTampaOrientation: boolean;
  reducedMotion: boolean;
  routeGeometry: MissionRouteGeometry;
}) {
  const { gl } = useThree();
  const [nightMap, topologyMap] = useLoader(THREE.TextureLoader, [
    "/textures/earth-night.jpg",
    "/textures/earth-topology.png",
  ]);
  const alignmentRotation = useMemo(() => {
    if (preferCanonicalTampaOrientation) {
      return new THREE.Euler(0, 0, 0);
    }
    const alignmentQuaternion = buildEarthTextureAlignmentQuaternion(routeGeometry);
    return new THREE.Euler().setFromQuaternion(alignmentQuaternion);
  }, [preferCanonicalTampaOrientation, routeGeometry]);
  const signalUniforms = useMemo(
    () => ({
      auroraViolet: { value: new THREE.Color("#8b68ff") },
      motionScale: { value: reducedMotion ? 0 : 1 },
      nightMap: { value: nightMap },
      signalCyan: { value: new THREE.Color("#63e7ff") },
      time: { value: 0 },
      topologyMap: { value: topologyMap },
    }),
    [nightMap, reducedMotion, topologyMap],
  );
  const baseUniforms = useMemo(
    () => ({
      auroraViolet: { value: new THREE.Color("#a67cff") },
      cityLightColor: { value: new THREE.Color("#ff5d78") },
      landColorA: { value: new THREE.Color("#24364e") },
      landColorB: { value: new THREE.Color("#e6f0ff") },
      nightMap: { value: nightMap },
      oceanColorA: { value: new THREE.Color("#05101d") },
      oceanColorB: { value: new THREE.Color("#154a77") },
      signalCyan: { value: new THREE.Color("#83f4ff") },
      topologyMap: { value: topologyMap },
    }),
    [nightMap, topologyMap],
  );

  useEffect(() => {
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    nightMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.anisotropy = anisotropy;
    nightMap.wrapS = THREE.RepeatWrapping;
    topologyMap.anisotropy = anisotropy;
    topologyMap.colorSpace = THREE.NoColorSpace;
    topologyMap.wrapS = THREE.RepeatWrapping;
    nightMap.needsUpdate = true;
    topologyMap.needsUpdate = true;
  }, [gl, nightMap, topologyMap]);

  useFrame(({ clock }) => {
    signalUniforms.time.value = reducedMotion ? 0 : clock.getElapsedTime();
  });

  return (
    <group rotation={alignmentRotation}>
      <mesh>
        <sphereGeometry args={[radius, 96, 96]} />
        <shaderMaterial
          fragmentShader={EARTH_BASE_FRAGMENT_SHADER}
          uniforms={baseUniforms}
          vertexShader={EARTH_BASE_VERTEX_SHADER}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.009, 96, 96]} />
        <shaderMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fragmentShader={EARTH_SIGNAL_FRAGMENT_SHADER}
          toneMapped={false}
          transparent
          uniforms={signalUniforms}
          vertexShader={EARTH_BASE_VERTEX_SHADER}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.016, 80, 80]} />
        <shaderMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fragmentShader={ATMOSPHERE_FRAGMENT_SHADER}
          side={THREE.BackSide}
          toneMapped={false}
          transparent
          uniforms={{
            auroraViolet: { value: new THREE.Color("#8b68ff") },
            signalCyan: { value: new THREE.Color("#63e7ff") },
          }}
          vertexShader={EARTH_BASE_VERTEX_SHADER}
        />
      </mesh>
    </group>
  );
}

function EarthBody({
  preferCanonicalTampaOrientation,
  reducedMotion,
  routeGeometry,
}: {
  preferCanonicalTampaOrientation: boolean;
  reducedMotion: boolean;
  routeGeometry: MissionRouteGeometry;
}) {
  return (
    <Suspense fallback={<EarthFallbackSphere radius={routeGeometry.earth_radius} />}>
      <EarthTexturedSphere
        radius={routeGeometry.earth_radius}
        preferCanonicalTampaOrientation={preferCanonicalTampaOrientation}
        reducedMotion={reducedMotion}
        routeGeometry={routeGeometry}
      />
    </Suspense>
  );
}

function TampaPulseMarker({
  earthRadius,
  reducedMotion,
}: {
  earthRadius: number;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const labelPosition = useMemo(() => {
    const basePoint = toEarthLatLonVectorNegativeZ(
      TAMPA_FALLBACK_LATITUDE_DEGREES,
      TAMPA_FALLBACK_LONGITUDE_DEGREES,
    )
      .normalize()
      .multiplyScalar(earthRadius * 1.085);
    return basePoint;
  }, [earthRadius]);

  useFrame(({ clock }) => {
    if (!groupRef.current || reducedMotion) {
      return;
    }

    const pulse = 1 + Math.sin(clock.getElapsedTime() * 1.8) * 0.08;
    groupRef.current.scale.setScalar(pulse);
  });

  return (
    <group position={labelPosition} ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.068, 16, 16]} />
        <meshBasicMaterial color="#ff2d55" toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.14, 0.01, 12, 36]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#ff5d78"
          depthWrite={false}
          opacity={0.52}
          toneMapped={false}
          transparent
        />
      </mesh>
      <Html center distanceFactor={12} position={[0.16, 0.12, 0]}>
        <div className="pointer-events-none flex items-center gap-1.5 rounded-full border border-[#ff5d78]/45 bg-[#111827]/92 px-2.5 py-1 text-[11px] font-medium text-[#f9fafb] shadow-[0_0_18px_rgba(255,45,85,0.18)] backdrop-blur-sm">
          <Heart className="h-3.5 w-3.5 fill-[#ff2d55] text-[#ff2d55]" />
          <span className="whitespace-nowrap font-sans tracking-[0.01em]">Tampa FL</span>
        </div>
      </Html>
    </group>
  );
}

function MoonDestinationMarker({
  moonPosition,
  moonRadius,
}: {
  moonPosition: THREE.Vector3;
  moonRadius: number;
}) {
  return (
    <group position={moonPosition}>
      <Html center distanceFactor={13} position={[moonRadius * 0.12, moonRadius * 1.02, 0]}>
        <div className="pointer-events-none flex items-center gap-1.5 rounded-full border border-[#8b68ff]/45 bg-[#111827]/92 px-2.5 py-1 text-[11px] font-medium text-[#f9fafb] shadow-[0_0_18px_rgba(139,104,255,0.18)] backdrop-blur-sm">
          <Moon className="h-3.5 w-3.5 text-[#a78bfa]" />
          <span className="whitespace-nowrap font-sans tracking-[0.01em]">Moon</span>
        </div>
      </Html>
    </group>
  );
}

function buildMoonSurfaceGeometry(radius: number) {
  const geometry = new THREE.SphereGeometry(radius, 88, 88);
  const noise = new ImprovedNoise();
  const positions = geometry.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(positions.count * 3);
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const highlandColor = new THREE.Color("#edf2f8");
  const mariaColor = new THREE.Color("#adb9c8");
  const craterRimColor = new THREE.Color("#ffffff");
  const workingColor = new THREE.Color();

  for (let index = 0; index < positions.count; index += 1) {
    vertex.fromBufferAttribute(positions, index);
    normal.copy(vertex).normalize();
    const macro = noise.noise(normal.x * 2.6 + 7.4, normal.y * 2.6 - 3.1, normal.z * 2.6 + 1.7);
    const micro = noise.noise(normal.x * 10.8, normal.y * 10.8, normal.z * 10.8);
    const mariaSignal = noise.noise(normal.x * 1.9 - 1.6, normal.y * 1.9 + 0.8, normal.z * 1.9 + 2.4);
    const craterSignal = noise.noise(
      normal.x * 18.5 - 2.2,
      normal.y * 18.5 + 5.1,
      normal.z * 18.5 + 4.7,
    );
    const craterMask = Math.max(0, 0.28 - Math.abs(craterSignal));
    const craterDrop = craterMask * radius * 0.06;
    const craterRim = smoothstep(0.02, 0.18, craterMask) * (1 - smoothstep(0.18, 0.28, craterMask));
    const mariaMask = smoothstep(-0.16, 0.32, mariaSignal);
    const displacement = macro * radius * 0.034 + micro * radius * 0.012 - craterDrop;

    vertex.addScaledVector(normal, displacement);
    positions.setXYZ(index, vertex.x, vertex.y, vertex.z);

    workingColor.copy(highlandColor).lerp(mariaColor, mariaMask * 0.78);
    workingColor.lerp(craterRimColor, craterRim * 0.82);
    workingColor.offsetHSL(0, 0, macro * 0.035 + micro * 0.018);
    colors[index * 3] = workingColor.r;
    colors[index * 3 + 1] = workingColor.g;
    colors[index * 3 + 2] = workingColor.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function MoonBody({
  moonMarkerState,
  reducedMotion,
  routeGeometry,
}: {
  moonMarkerState: ReturnType<typeof buildMissionMilestoneRenderStates>[number] | null;
  reducedMotion: boolean;
  routeGeometry: MissionRouteGeometry;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const moonGeometry = useMemo(
    () => buildMoonSurfaceGeometry(routeGeometry.moon_radius),
    [routeGeometry.moon_radius],
  );
  const moonEmissiveIntensity =
    moonMarkerState?.status === "current"
      ? 0.12
      : moonMarkerState?.status === "next"
        ? 0.08
        : 0.05;

  useEffect(() => {
    return () => {
      moonGeometry.dispose();
    };
  }, [moonGeometry]);

  useFrame((_state, delta) => {
    if (!groupRef.current || reducedMotion) {
      return;
    }
    groupRef.current.rotation.y += delta * 0.045;
    groupRef.current.rotation.x += delta * 0.008;
  });

  return (
    <group position={toThreeVector(routeGeometry.moon_position)} ref={groupRef}>
      <pointLight color="#edf4ff" distance={18} intensity={0.54} position={[0.8, 0.45, 1.55]} />
      <pointLight color="#9fb5d8" distance={12} intensity={0.18} position={[-0.9, -0.3, -1.2]} />
      <pointLight color="#8b68ff" distance={8} intensity={0.08} position={[0.2, 0.9, 0.6]} />
      <mesh>
        <primitive object={moonGeometry} attach="geometry" />
        <meshStandardMaterial
          color="#f5f8ff"
          emissive={moonMarkerState?.status === "current" ? "#6f4f5e" : "#2d3f55"}
          emissiveIntensity={moonEmissiveIntensity}
          metalness={0.01}
          roughness={0.84}
          vertexColors
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[routeGeometry.moon_radius * 1.018, 48, 48]} />
        <shaderMaterial
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fragmentShader={MOON_RIM_FRAGMENT_SHADER}
          side={THREE.BackSide}
          toneMapped={false}
          transparent
          uniforms={{
            rimColor: { value: new THREE.Color("#f7fbff") },
          }}
          vertexShader={EARTH_BASE_VERTEX_SHADER}
        />
      </mesh>
    </group>
  );
}

const ROUTE_GRADIENT_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const ROUTE_GRADIENT_FRAGMENT_SHADER = `
uniform vec3 colorStart;
uniform vec3 colorMid;
uniform vec3 colorEnd;
uniform float emissiveIntensity;
varying vec2 vUv;
void main() {
  float t = vUv.x;
  vec3 color = t < 0.5
    ? mix(colorStart, colorMid, t * 2.0)
    : mix(colorMid, colorEnd, (t - 0.5) * 2.0);
  float alpha = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.72, t);
  gl_FragColor = vec4(color * emissiveIntensity, alpha);
}`;

function RouteRibbon({
  aggregate,
  detailMode,
  reducedMotion,
  routeGeometry,
}: {
  aggregate: MissionOverview["aggregate"];
  detailMode: "balanced" | "conservative";
  reducedMotion: boolean;
  routeGeometry: MissionRouteGeometry;
}) {
  const tier = useMemo(
    () => getMissionSceneTierConfig(detailMode, reducedMotion),
    [detailMode, reducedMotion],
  );
  const isStandby = aggregate.total_distance_m <= 0;
  const routePolyline = useMemo(
    () => buildMissionRoutePolyline(routeGeometry).map(toThreeVector),
    [routeGeometry],
  );
  const progressPolyline = useMemo(
    () =>
      buildProgressRoutePolylineFromAggregate(
        routeGeometry,
        aggregate,
        tier.routeSamplesPerLeg,
      ).map(toThreeVector),
    [aggregate, routeGeometry, tier.routeSamplesPerLeg],
  );
  const remainingPolyline = useMemo(
    () =>
      buildRemainingRoutePolylineFromAggregate(
        routeGeometry,
        aggregate,
        tier.routeSamplesPerLeg,
      ).map(toThreeVector),
    [aggregate, routeGeometry, tier.routeSamplesPerLeg],
  );
  const fullRouteCurve = useMemo(
    () => (routePolyline.length >= 2 ? buildCurve(routePolyline) : null),
    [routePolyline],
  );
  const baselineStartPoint = routePolyline[0] ?? null;
  const progressCurve = useMemo(
    () => (progressPolyline.length >= 2 ? buildCurve(progressPolyline) : null),
    [progressPolyline],
  );
  const remainingCurve = useMemo(
    () => (remainingPolyline.length >= 2 ? buildCurve(remainingPolyline) : null),
    [remainingPolyline],
  );
  const activeLeg = useMemo(() => {
    const activeLegKey = aggregate.route_progress.active_leg_key;
    return activeLegKey
      ? routeGeometry.legs.find((leg) => leg.key === activeLegKey) ?? null
      : null;
  }, [aggregate.route_progress.active_leg_key, routeGeometry.legs]);
  const activeLegCurve = useMemo(
    () => (activeLeg ? buildCurve(activeLeg.points) : null),
    [activeLeg],
  );

  const routeGradientUniforms = useMemo(
    () => ({
      colorStart: { value: new THREE.Color("#63e7ff") },
      colorMid: { value: new THREE.Color("#9ef2ff") },
      colorEnd: { value: new THREE.Color("#8b68ff") },
      emissiveIntensity: { value: detailMode === "conservative" ? 0.92 : 1.18 },
    }),
    [detailMode],
  );

  return (
    <group renderOrder={2}>
      {!isStandby && fullRouteCurve ? (
        <>
          <mesh renderOrder={1}>
            <tubeGeometry args={[fullRouteCurve, 260, tier.baselineRouteRadius, 8, false]} />
            <meshStandardMaterial
              color="#203a64"
              emissive="#3f5e97"
              emissiveIntensity={0.22}
              metalness={0.06}
              opacity={isStandby ? 0.04 : 0.14}
              roughness={0.58}
              transparent
            />
          </mesh>
          {baselineStartPoint ? (
            <mesh position={baselineStartPoint} renderOrder={1}>
              <sphereGeometry args={[tier.baselineRouteRadius * 1.38, 14, 14]} />
              <meshStandardMaterial
                color="#203a64"
                emissive="#3f5e97"
                emissiveIntensity={0.22}
                metalness={0.04}
                opacity={isStandby ? 0.04 : 0.14}
                roughness={0.7}
                transparent
              />
            </mesh>
          ) : null}
        </>
      ) : null}
      {!isStandby && activeLegCurve ? (
        <mesh renderOrder={2}>
          <tubeGeometry args={[activeLegCurve, 180, tier.activeLegRadius, 12, false]} />
          <meshBasicMaterial
            blending={THREE.AdditiveBlending}
            color="#8ea8ff"
            depthWrite={false}
            opacity={
              isStandby
                ? 0
                : activeLeg?.key === "earth_loop"
                  ? 0.022
                  : detailMode === "conservative"
                    ? 0.045
                    : 0.075
            }
            toneMapped={false}
            transparent
          />
        </mesh>
      ) : null}
      {!isStandby && remainingCurve ? (
        <mesh renderOrder={3}>
          <tubeGeometry args={[remainingCurve, 220, tier.remainingRouteRadius, 8, false]} />
          <meshStandardMaterial
            color="#42567f"
            emissive="#5a6da3"
            emissiveIntensity={0.12}
            metalness={0.04}
            opacity={isStandby ? 0.03 : 0.12}
            roughness={0.72}
            transparent
          />
        </mesh>
      ) : null}
      {!isStandby && progressCurve ? (
        <>
          <mesh renderOrder={3}>
            <tubeGeometry args={[progressCurve, 240, tier.progressRouteRadius * 1.9, 10, false]} />
            <meshBasicMaterial
              blending={THREE.AdditiveBlending}
              color="#71dfff"
              depthWrite={false}
              opacity={detailMode === "conservative" ? 0.08 : 0.12}
              toneMapped={false}
              transparent
            />
          </mesh>
          <mesh renderOrder={4}>
            <tubeGeometry args={[progressCurve, 240, tier.progressRouteRadius, 12, false]} />
            <shaderMaterial
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              fragmentShader={ROUTE_GRADIENT_FRAGMENT_SHADER}
              toneMapped={false}
              transparent
              uniforms={routeGradientUniforms}
              vertexShader={ROUTE_GRADIENT_VERTEX_SHADER}
            />
          </mesh>
        </>
      ) : null}
    </group>
  );
}

function StandbyEarthLoopGuide({
  detailMode,
  routeGeometry,
}: {
  detailMode: "balanced" | "conservative";
  routeGeometry: MissionRouteGeometry;
}) {
  const guidePositions = useMemo(() => {
    const latitude = TAMPA_FALLBACK_LATITUDE_DEGREES;
    const startingLongitude = TAMPA_FALLBACK_LONGITUDE_DEGREES;
    const sampleCount = detailMode === "conservative" ? 116 : 164;
    const positions: number[] = [];

    for (let index = 0; index < sampleCount; index += 1) {
      const progress = index / Math.max(sampleCount - 1, 1);
      const longitude = startingLongitude + progress * 360;
      const point = toEarthLatLonVectorNegativeZ(latitude, longitude)
        .normalize()
        .multiplyScalar(routeGeometry.earth_radius * 1.02);
      positions.push(point.x, point.y, point.z);
    }

    return new Float32Array(positions);
  }, [detailMode, routeGeometry.earth_radius]);

  if (guidePositions.length === 0) {
    return null;
  }

  return (
    <points renderOrder={2}>
      <bufferGeometry>
        <bufferAttribute
          args={[guidePositions, 3]}
          attach="attributes-position"
          count={guidePositions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        depthWrite={false}
        opacity={0.96}
        size={detailMode === "conservative" ? 0.038 : 0.034}
        sizeAttenuation
        toneMapped={false}
        transparent
      />
    </points>
  );
}

function StandbyMoonNavigationGuide({
  detailMode,
  earthSystemRef,
  routeGeometry,
}: {
  detailMode: "balanced" | "conservative";
  earthSystemRef: React.RefObject<THREE.Group | null>;
  routeGeometry: MissionRouteGeometry;
}) {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const tampaLocalPosition = useMemo(
    () =>
      toEarthLatLonVectorNegativeZ(
        TAMPA_FALLBACK_LATITUDE_DEGREES,
        TAMPA_FALLBACK_LONGITUDE_DEGREES,
      )
        .normalize()
        .multiplyScalar(routeGeometry.earth_radius * 1.015),
    [routeGeometry.earth_radius],
  );
  const moonPosition = useMemo(
    () => toThreeVector(routeGeometry.moon_position),
    [routeGeometry.moon_position],
  );
  const nearMoonSurface = useMemo(() => {
    const moonFacingDirection = moonPosition.clone().normalize().multiplyScalar(-1);
    return moonPosition
      .clone()
      .add(moonFacingDirection.multiplyScalar(routeGeometry.moon_radius * 0.94));
  }, [moonPosition, routeGeometry.moon_radius]);
  const sampleCount = detailMode === "conservative" ? 24 : 34;

  useFrame(() => {
    if (!geometryRef.current || !earthSystemRef.current) {
      return;
    }

    const tampaWorldPosition = tampaLocalPosition
      .clone()
      .applyQuaternion(earthSystemRef.current.quaternion);
    const midpoint = tampaWorldPosition.clone().lerp(nearMoonSurface, 0.5);
    const curveHeight = THREE.MathUtils.lerp(1.4, 2.0, detailMode === "conservative" ? 0 : 1);
    const controlPoint = midpoint
      .clone()
      .normalize()
      .multiplyScalar(midpoint.length() + curveHeight);
    const curve = new THREE.QuadraticBezierCurve3(
      tampaWorldPosition,
      controlPoint,
      nearMoonSurface,
    );
    const sampledPoints = curve.getPoints(sampleCount);

    geometryRef.current.setFromPoints(sampledPoints);
  });

  return (
    <points renderOrder={2}>
      <bufferGeometry ref={geometryRef} />
      <pointsMaterial
        color="#f8fbff"
        depthWrite={false}
        opacity={0.94}
        size={detailMode === "conservative" ? 0.036 : 0.032}
        sizeAttenuation
        toneMapped={false}
        transparent
      />
    </points>
  );
}

function ProgressBeacon({
  aggregate,
  reducedMotion,
  routeGeometry,
}: {
  aggregate: MissionOverview["aggregate"];
  reducedMotion: boolean;
  routeGeometry: MissionRouteGeometry;
}) {
  const progress = getMissionAggregateRouteProgress(aggregate, routeGeometry);
  const progressCurve = useMemo(() => {
    if (!progress.leg) {
      return null;
    }
    return buildCurve(progress.leg.points);
  }, [progress.leg]);
  const beaconRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const isStandby = aggregate.total_distance_m <= 0;

  if (isStandby) {
    return null;
  }

  useFrame(({ clock }) => {
    if (!progressCurve || !beaconRef.current || !ringRef.current) {
      return;
    }

    const currentPoint = progressCurve.getPointAt(progress.legProgress);
    const time = reducedMotion ? 0 : clock.getElapsedTime();
    const pulse = 1 + Math.sin(time * 2.2) * 0.08;

    beaconRef.current.position.copy(currentPoint);
    beaconRef.current.scale.setScalar(pulse);
    ringRef.current.position.copy(currentPoint);
    ringRef.current.scale.setScalar(1.12 + Math.sin(time * 1.5) * 0.05);

    if (outerRingRef.current) {
      outerRingRef.current.position.copy(currentPoint);
      outerRingRef.current.scale.setScalar(
        1.38 + Math.sin(time * 1.1) * 0.06,
      );
      outerRingRef.current.rotation.z = time * 0.22;
    }

    if (glowRef.current) {
      glowRef.current.position.copy(currentPoint);
      const glowPulse = 0.28 + Math.sin(time * 1.8) * 0.06;
      glowRef.current.scale.setScalar(glowPulse);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.12 + Math.sin(time * 2.2) * 0.03;
    }
  });

  return (
    <group>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#63e7ff"
          depthWrite={false}
          opacity={0.12}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh ref={beaconRef}>
        <sphereGeometry args={[0.09, 18, 18]} />
        <meshBasicMaterial color="#f4fbff" toneMapped={false} />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.17, 0.013, 14, 42]} />
        <meshBasicMaterial color="#63e7ff" opacity={0.68} toneMapped={false} transparent />
      </mesh>
      <mesh ref={outerRingRef}>
        <torusGeometry args={[0.24, 0.006, 10, 48]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#ff5d78"
          depthWrite={false}
          opacity={0.16}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

function WindowSegmentsInstances({
  capacity,
  curveMap,
  opacity,
  reducedMotion,
  routeGeometry,
  segmentsWindow,
  sizeRange,
  variant,
}: {
  capacity: number;
  curveMap: Map<string, THREE.CatmullRomCurve3>;
  opacity: number;
  reducedMotion: boolean;
  routeGeometry: MissionRouteGeometry;
  segmentsWindow: MissionSegmentsWindow;
  sizeRange: [number, number];
  variant: "recent" | "near_progress" | "milestone_local" | "country_highlights";
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const points = useMemo(
    () =>
      segmentsWindow.segments.slice(0, capacity).map((segment, index) => {
        const progress = getMissionRouteProgress(segment.route_position_m, routeGeometry);
        const curve = progress.leg ? curveMap.get(progress.leg.key) ?? null : null;
        const point = curve?.getPointAt(progress.legProgress) ?? new THREE.Vector3(0, 0, 0);
        const range = sizeRange[1] - sizeRange[0];
        const intensity =
          variant === "country_highlights"
            ? 1
            : Math.max(0, 1 - index / Math.max(capacity - 1, 1));
        const scale = sizeRange[0] + range * intensity;
        const radialLift =
          variant === "milestone_local" ? 0.18 : variant === "country_highlights" ? 0.26 : 0.08;
        const liftedPoint = point.clone().normalize().multiplyScalar(point.length() + radialLift);

        return {
          baseScale: scale,
          color:
            variant === "country_highlights" ? "#a78bfa" : paletteKeyToSceneColor(segment.palette_key),
          point: liftedPoint,
          recency: intensity,
        };
      }),
    [capacity, curveMap, routeGeometry, segmentsWindow.segments, sizeRange, variant],
  );

  if (points.length === 0) {
    return null;
  }

  useEffect(() => {
    if (!meshRef.current) {
      return;
    }

    const dummy = new THREE.Object3D();
    points.forEach((point, index) => {
      dummy.position.copy(point.point);
      dummy.scale.setScalar(point.baseScale);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(index, dummy.matrix);
      meshRef.current?.setColorAt(index, new THREE.Color(point.color));
    });
    meshRef.current.count = points.length;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [points]);

  useFrame(({ clock }) => {
    if (!meshRef.current || reducedMotion || variant === "country_highlights") {
      return;
    }

    const time = clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    const pulseCount = Math.min(points.length, variant === "recent" ? 8 : 4);

    for (let i = 0; i < pulseCount; i++) {
      const point = points[i];
      const phase = time * 1.8 + i * 0.7;
      const pulse = 1 + Math.sin(phase) * 0.18 * point.recency;
      dummy.position.copy(point.point);
      dummy.scale.setScalar(point.baseScale * pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh args={[undefined, undefined, Math.max(capacity, 1)]} ref={meshRef}>
      <sphereGeometry args={[1, variant === "country_highlights" ? 6 : 5, variant === "country_highlights" ? 6 : 5]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={opacity} vertexColors />
    </instancedMesh>
  );
}

function LandmarkInstances({
  inspectMode,
  focusedWaypointKey,
  routeGeometry,
}: {
  inspectMode: boolean;
  focusedWaypointKey: string | null;
  routeGeometry: MissionRouteGeometry;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const landmarks = useMemo(
    () =>
      routeGeometry.waypoints.filter(
        (waypoint) =>
          waypoint.kind !== "milestone" &&
          waypoint.key !== "moon_distance" &&
          !(!inspectMode && focusedWaypointKey === "tampa" && waypoint.key === "tampa"),
      ),
    [focusedWaypointKey, inspectMode, routeGeometry.waypoints],
  );

  if (landmarks.length === 0) {
    return null;
  }

  useEffect(() => {
    if (!meshRef.current) {
      return;
    }

    const dummy = new THREE.Object3D();
    landmarks.forEach((waypoint, index) => {
      const isFocused = waypoint.key === focusedWaypointKey;
      const basePoint = toThreeVector(waypoint.position);
      const liftedPoint = basePoint
        .clone()
        .normalize()
        .multiplyScalar(basePoint.length() + 0.08);
      const scale = isFocused ? 0.14 : waypoint.key === "cape_canaveral" ? 0.11 : 0.095;

      dummy.position.copy(liftedPoint);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(index, dummy.matrix);
      meshRef.current?.setColorAt(
        index,
        new THREE.Color(
          isFocused
            ? "#f4fbff"
            : waypoint.key === "cape_canaveral"
              ? "#8fd7ff"
              : waypoint.key === "tampa_return"
                ? "#8b68ff"
                : "#63e7ff",
        ),
      );
    });
    meshRef.current.count = landmarks.length;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [focusedWaypointKey, landmarks]);

  return (
    <instancedMesh args={[undefined, undefined, Math.max(landmarks.length, 1)]} ref={meshRef}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.9} vertexColors />
    </instancedMesh>
  );
}

function MilestoneMarkerInstances({
  focusedWaypointKey,
  overview,
  reducedMotion,
  routeGeometry,
}: {
  focusedWaypointKey: string | null;
  overview: MissionOverview;
  reducedMotion: boolean;
  routeGeometry: MissionRouteGeometry;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const markerStates = useMemo(
    () =>
      buildMissionMilestoneRenderStates(routeGeometry, overview, focusedWaypointKey).filter(
        (state) => state.marker.waypoint_key !== "moon_distance" && state.marker.milestone_key !== "moon_distance",
      ),
    [focusedWaypointKey, overview, routeGeometry],
  );

  if (markerStates.length === 0) {
    return null;
  }

  useEffect(() => {
    if (!meshRef.current) {
      return;
    }

    const dummy = new THREE.Object3D();
    markerStates.forEach((state, index) => {
      const basePoint = toThreeVector(state.marker.position);
      const liftedPoint = basePoint
        .clone()
        .normalize()
        .multiplyScalar(basePoint.length() + (state.status === "current" ? 0.28 : 0.22));
      const scale =
        state.isFocused
          ? 0.18
          : state.status === "current"
            ? 0.16
            : state.status === "next"
              ? 0.14
              : state.status === "reached"
                ? 0.12
                : 0.095;

      const color =
        state.status === "current"
          ? "#ff5d78"
          : state.status === "next"
            ? "#8b68ff"
            : state.status === "reached"
              ? "#63e7ff"
              : "#51607d";

      dummy.position.copy(liftedPoint);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(index, dummy.matrix);
      meshRef.current?.setColorAt(index, new THREE.Color(color));
    });

    meshRef.current.count = markerStates.length;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [markerStates]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || reducedMotion) {
      return;
    }

    const dummy = new THREE.Object3D();
    markerStates.forEach((state, index) => {
      if (state.status !== "current" && state.status !== "next") {
        return;
      }

      const basePoint = toThreeVector(state.marker.position);
      const liftedPoint = basePoint
        .clone()
        .normalize()
        .multiplyScalar(basePoint.length() + (state.status === "current" ? 0.28 : 0.22));
      const pulse = 1 + Math.sin(clock.getElapsedTime() * (state.status === "current" ? 1.9 : 1.2) + index) * 0.08;
      const baseScale = state.status === "current" ? 0.16 : 0.14;

      dummy.position.copy(liftedPoint);
      dummy.scale.setScalar(baseScale * pulse);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh args={[undefined, undefined, Math.max(markerStates.length, 1)]} ref={meshRef}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.98} vertexColors />
    </instancedMesh>
  );
}

function EarthSystemGroup({
  children,
  detailMode,
  earthSystemRef,
  preferCanonicalTampaOrientation,
  reducedMotion,
  routeGeometry,
}: {
  children: React.ReactNode;
  detailMode: "balanced" | "conservative";
  earthSystemRef?: React.RefObject<THREE.Group | null>;
  preferCanonicalTampaOrientation: boolean;
  reducedMotion: boolean;
  routeGeometry: MissionRouteGeometry;
}) {
  const localGroupRef = useRef<THREE.Group>(null);
  const groupRef = earthSystemRef ?? localGroupRef;
  const initializedRef = useRef(false);
  const tier = useMemo(
    () => getMissionSceneTierConfig(detailMode, reducedMotion),
    [detailMode, reducedMotion],
  );

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * tier.earthRotationSpeed;
    }
  });

  useEffect(() => {
    if (!groupRef.current || initializedRef.current) {
      return;
    }

    const tampaWaypoint = getMissionWaypointByKey(routeGeometry, "tampa");
    const tampaVector = preferCanonicalTampaOrientation
      ? toEarthLatLonVectorNegativeZ(
          TAMPA_FALLBACK_LATITUDE_DEGREES,
          TAMPA_FALLBACK_LONGITUDE_DEGREES,
        ).normalize()
      : tampaWaypoint
        ? toThreeVector(tampaWaypoint.position).clone().normalize()
        : toEarthLatLonVectorNegativeZ(
            TAMPA_FALLBACK_LATITUDE_DEGREES,
            TAMPA_FALLBACK_LONGITUDE_DEGREES,
          ).normalize();
    const baseQuaternion = new THREE.Quaternion().setFromUnitVectors(
      tampaVector,
      EARTH_INITIAL_VIEW_VECTOR,
    );
    const rollQuaternion = new THREE.Quaternion().setFromAxisAngle(
      EARTH_INITIAL_VIEW_VECTOR,
      EARTH_INITIAL_ROLL_OFFSET_RADIANS,
    );
    const tampaYawQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      preferCanonicalTampaOrientation ? EARTH_CANONICAL_TAMPA_YAW_OFFSET_RADIANS : 0,
    );

    baseQuaternion.multiply(rollQuaternion);
    baseQuaternion.premultiply(tampaYawQuaternion);
    groupRef.current.rotation.setFromQuaternion(baseQuaternion);
    initializedRef.current = true;
  }, [preferCanonicalTampaOrientation, routeGeometry]);

  return <group ref={groupRef}>{children}</group>;
}

function MissionSceneContent(props: MissionControlSceneProps) {
  const earthSystemRef = useRef<THREE.Group>(null);
  const curveMap = useMemo(() => buildCurveMap(props.routeGeometry), [props.routeGeometry]);
  const isStandby = props.overview.aggregate.total_distance_m <= 0;
  const useCanonicalTampaOpening = isStandby && !props.inspectMode && props.focusedWaypointKey === "tampa";
  const tier = useMemo(
    () => getMissionSceneTierConfig(props.detailMode, props.reducedMotion),
    [props.detailMode, props.reducedMotion],
  );
  const moonMarkerState = useMemo(
    () =>
      buildMissionMilestoneRenderStates(
        props.routeGeometry,
        props.overview,
        props.focusedWaypointKey,
      ).find(
        (state) =>
          state.marker.waypoint_key === "moon_distance" ||
          state.marker.milestone_key === "moon_distance",
      ) ?? null,
    [props.focusedWaypointKey, props.overview, props.routeGeometry],
  );

  return (
    <>
      <color args={["#0a0e1a"]} attach="background" />
      <fog attach="fog" args={["#050814", 16, 34]} />
      <hemisphereLight color="#6c8ec0" groundColor="#03060d" intensity={0.34} />
      <directionalLight color="#dce9ff" intensity={0.98} position={[5.4, 3.4, 4.8]} />
      <pointLight color="#6be8ff" distance={18} intensity={0.28} position={[-4, 1.6, -6]} />
      <pointLight color="#8b68ff" distance={18} intensity={0.18} position={[4.5, -2.4, 2.4]} />

      <Stars
        count={tier.starsCount}
        depth={72}
        factor={props.detailMode === "conservative" ? 2.2 : 3.1}
        fade
        radius={96}
        saturation={0}
        speed={tier.starSpeed}
      />

      <EarthSystemGroup
        detailMode={props.detailMode}
        earthSystemRef={earthSystemRef}
        preferCanonicalTampaOrientation={useCanonicalTampaOpening}
        reducedMotion={props.reducedMotion}
        routeGeometry={props.routeGeometry}
      >
        <EarthBody
          preferCanonicalTampaOrientation={useCanonicalTampaOpening}
          reducedMotion={props.reducedMotion}
          routeGeometry={props.routeGeometry}
        />
        {useCanonicalTampaOpening ? (
          <StandbyEarthLoopGuide
            detailMode={props.detailMode}
            routeGeometry={props.routeGeometry}
          />
        ) : null}
        {useCanonicalTampaOpening ? (
          <TampaPulseMarker
            earthRadius={props.routeGeometry.earth_radius}
            reducedMotion={props.reducedMotion}
          />
        ) : null}
        {!isStandby ? (
          <>
            <RouteRibbon
              aggregate={props.overview.aggregate}
              detailMode={props.detailMode}
              reducedMotion={props.reducedMotion}
              routeGeometry={props.routeGeometry}
            />
            <MilestoneMarkerInstances
              focusedWaypointKey={props.focusedWaypointKey}
              overview={props.overview}
              reducedMotion={props.reducedMotion}
              routeGeometry={props.routeGeometry}
            />
            <LandmarkInstances
              inspectMode={props.inspectMode}
              focusedWaypointKey={props.focusedWaypointKey}
              routeGeometry={props.routeGeometry}
            />
            <WindowSegmentsInstances
              capacity={tier.recentCapacity}
              curveMap={curveMap}
              opacity={props.detailMode === "conservative" ? 0.68 : 0.8}
              reducedMotion={props.reducedMotion}
              routeGeometry={props.routeGeometry}
              segmentsWindow={props.segmentsWindows.recent}
              sizeRange={
                props.detailMode === "conservative" ? [0.06, 0.12] : [0.075, 0.18]
              }
              variant="recent"
            />
            <WindowSegmentsInstances
              capacity={tier.nearProgressCapacity}
              curveMap={curveMap}
              opacity={props.detailMode === "conservative" ? 0.34 : 0.42}
              reducedMotion={props.reducedMotion}
              routeGeometry={props.routeGeometry}
              segmentsWindow={props.segmentsWindows.nearProgress}
              sizeRange={
                props.detailMode === "conservative" ? [0.1, 0.16] : [0.12, 0.22]
              }
              variant="near_progress"
            />
            {tier.enableSupplementalWindows ? (
              <>
                <WindowSegmentsInstances
                  capacity={tier.milestoneCapacity}
                  curveMap={curveMap}
                  opacity={0.34}
                  reducedMotion={props.reducedMotion}
                  routeGeometry={props.routeGeometry}
                  segmentsWindow={props.segmentsWindows.milestoneLocal}
                  sizeRange={[0.13, 0.22]}
                  variant="milestone_local"
                />
                <WindowSegmentsInstances
                  capacity={tier.countryHighlightCapacity}
                  curveMap={curveMap}
                  opacity={0.18}
                  reducedMotion={props.reducedMotion}
                  routeGeometry={props.routeGeometry}
                  segmentsWindow={props.segmentsWindows.countryHighlights}
                  sizeRange={[0.14, 0.28]}
                  variant="country_highlights"
                />
              </>
            ) : null}
            <ProgressBeacon
              aggregate={props.overview.aggregate}
              reducedMotion={props.reducedMotion}
              routeGeometry={props.routeGeometry}
            />
          </>
        ) : null}
      </EarthSystemGroup>

      <MoonBody
        moonMarkerState={moonMarkerState}
        reducedMotion={props.reducedMotion}
        routeGeometry={props.routeGeometry}
      />
      {useCanonicalTampaOpening ? (
        <>
          <StandbyMoonNavigationGuide
            detailMode={props.detailMode}
            earthSystemRef={earthSystemRef}
            routeGeometry={props.routeGeometry}
          />
          <MoonDestinationMarker
            moonPosition={toThreeVector(props.routeGeometry.moon_position)}
            moonRadius={props.routeGeometry.moon_radius}
          />
        </>
      ) : null}

      <MissionCameraRig
        aggregate={props.overview.aggregate}
        focusedWaypointKey={props.focusedWaypointKey}
        inspectMode={props.inspectMode}
        reducedMotion={props.reducedMotion}
        routeGeometry={props.routeGeometry}
      />
      <MissionBloomComposer detailMode={props.detailMode} reducedMotion={props.reducedMotion} />
      <MissionPerformanceProbe
        detailMode={props.detailMode}
        onSceneLoaded={props.onSceneLoaded}
        reducedMotion={props.reducedMotion}
      />
    </>
  );
}

export function MissionControlScene(props: MissionControlSceneProps) {
  return (
    <div className="absolute inset-0" data-testid="mission-scene-stage">
      <Canvas
        camera={{ far: 120, fov: 36, near: 0.1, position: [4.9, 1.34, 17.2] }}
        dpr={props.detailMode === "conservative" ? [1, 1.2] : [1, 1.55]}
        gl={{
          alpha: true,
          antialias: props.detailMode === "balanced",
          powerPreference: "high-performance",
        }}
      >
        <MissionSceneContent {...props} />
      </Canvas>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(99,231,255,0.2), transparent 24%), radial-gradient(circle at 82% 14%, rgba(139,104,255,0.22), transparent 22%), radial-gradient(circle at 60% 80%, rgba(255,93,120,0.12), transparent 24%), radial-gradient(circle at 50% 50%, rgba(10,16,28,0.18), transparent 52%), linear-gradient(180deg, rgba(4,8,18,0.06), rgba(4,8,18,0.46))",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%] bg-gradient-to-t from-[#040814]/86 via-[#040814]/24 to-transparent"
      />
    </div>
  );
}
