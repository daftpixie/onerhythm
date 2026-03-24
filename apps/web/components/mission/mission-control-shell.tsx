"use client";

import Link from "next/link";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Globe2,
  Heart,
  Milestone,
  Rocket,
  Signal,
} from "lucide-react";

import type {
  MissionActivityStats,
  MissionOverview,
  MissionRouteGeometry,
  MissionRhythmTypeStats,
  MissionScenePerformanceTier,
  MissionSegmentsWindow,
} from "@onerhythm/types";

import { siteContent } from "../../content/site-copy";
import {
  buildEmptyMissionSegmentsWindow,
  getMissionMilestoneMarkerByKey,
} from "../../lib/mission-v3-scene";
import {
  buildEmptyMissionActivityStats,
  buildEmptyMissionRhythmTypeStats,
  formatCountryLabel,
  formatMissionDistance,
  formatMissionMeters,
  formatRelativeJoinTime,
} from "../../lib/mission-v3-overview";
import { useMissionSceneTelemetry } from "../../lib/use-mission-scene-telemetry";
import { useMissionLiveOverview } from "../../lib/use-mission-live-overview";
import { useMissionSegmentsWindow } from "../../lib/use-mission-segments-window";
import { MissionControlScene } from "./mission-control-scene";
import { HudPanel } from "./hud/HudPanel";

// ─── Constants ──────────────────────────────────────────────────────────────

const SIGNAL_CYAN = "#00D4FF";
const PULSE_RED = "#FF2D55";
const AURORA_VIOLET = "#7C3AED";
const SUCCESS_GREEN = "#10B981";
const TEXT_TERTIARY = "#6B7280";

const RHYTHM_TYPE_COLORS: Record<string, string> = {
  normal: SIGNAL_CYAN,
  pvcs: PULSE_RED,
  afib: AURORA_VIOLET,
  svt: "#F59E0B",
  vt: "#EF4444",
  flutter: "#F97316",
  icd_warrior: SUCCESS_GREEN,
  caregiver: "#C4B5FD",
  supporter: "#66E5FF",
  other: TEXT_TERTIARY,
};

// ─── Types ──────────────────────────────────────────────────────────────────

type MissionControlShellProps = {
  initialActivityStats?: MissionActivityStats;
  initialOverview: MissionOverview;
  initialRhythmTypeStats?: MissionRhythmTypeStats;
  initialRouteGeometry: MissionRouteGeometry;
  initialSegmentsWindow: MissionSegmentsWindow;
  initialNearProgressWindow?: MissionSegmentsWindow;
  initialMilestoneLocalWindow?: MissionSegmentsWindow;
  initialCountryHighlightWindow?: MissionSegmentsWindow;
};

type ActivityScope = "hourly" | "daily" | "weekly" | "monthly";

// ─── Utilities ──────────────────────────────────────────────────────────────

function supportsWebgl() {
  if (typeof document === "undefined") {
    return false;
  }
  const canvas = document.createElement("canvas");
  return Boolean(
    canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl"),
  );
}

function formatReadableLabel(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// ─── Error Boundary ─────────────────────────────────────────────────────────

type MissionSceneErrorBoundaryProps = {
  children: ReactNode;
  onError: (error: Error) => void;
};

type MissionSceneErrorBoundaryState = {
  hasError: boolean;
};

class MissionSceneErrorBoundary extends Component<
  MissionSceneErrorBoundaryProps,
  MissionSceneErrorBoundaryState
> {
  state: MissionSceneErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

// ─── Fallback Field ─────────────────────────────────────────────────────────

function MissionFallbackField() {
  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(0,212,255,0.13),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(167,139,250,0.14),transparent_22%),rgba(4,8,18,0.94)]"
      data-testid="mission-scene-fallback"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/60 to-transparent" />
      <div className="flex h-full flex-col items-center justify-center p-6">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-signal-soft">
          {siteContent.mission.fallbackEyebrow}
        </p>
        <h2 className="mt-2 font-display text-[clamp(1.5rem,3vw,2.4rem)] leading-[0.95] tracking-[-0.05em] text-text-primary text-center">
          {siteContent.mission.fallbackHeadline}
        </h2>
        <p className="mt-2 max-w-md text-center text-sm text-text-secondary">
          {siteContent.mission.fallbackNoWebgl}
        </p>
      </div>
    </div>
  );
}

// ─── Live Clock ─────────────────────────────────────────────────────────────

function LiveClock({ className }: { className?: string }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={className ?? "font-mono text-sm font-bold tracking-wider text-[#F9FAFB]"}>
      {time}
    </span>
  );
}

// ─── Data Label ─────────────────────────────────────────────────────────────

function DataLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[9px] uppercase tracking-widest text-[#9CA3AF]">
      {children}
    </div>
  );
}

// ─── Rhythm Chain Strip ─────────────────────────────────────────────────────

function RhythmChainStrip({ overview }: { overview: MissionOverview }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const allJoins = overview.recent_joins;

  if (allJoins.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#6B7280]">
          The rhythm chain will appear as people join the mission
        </span>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="mission-scrollbar flex h-full items-center gap-2 overflow-x-auto px-3 scrollbar-thin">
      {allJoins.map((join) => {
        const thumbUrl = join.art_preview?.thumb_url || join.art_preview?.image_url;
        return (
          <div key={join.contribution_id} className="group relative h-[72px] w-[72px] shrink-0">
            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt={join.art_preview?.alt_text ?? "Rhythm art"}
                className="h-full w-full rounded border border-[#374151] object-cover transition-all group-hover:border-[#00D4FF] group-hover:shadow-[0_0_12px_rgba(0,212,255,0.2)]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded border border-[#374151] bg-[#111827]">
                <Heart className="h-4 w-4 text-[#374151]" />
              </div>
            )}
            <div className="pointer-events-none absolute -top-14 left-1/2 z-30 hidden -translate-x-1/2 rounded border border-[#374151] bg-[#111827]/95 px-2 py-1.5 text-center backdrop-blur-sm group-hover:block">
              <div className="whitespace-nowrap font-mono text-[9px] text-[#F9FAFB]">
                {join.display_name ?? "Anonymous"}
              </div>
              <div className="whitespace-nowrap font-mono text-[8px] text-[#9CA3AF]">
                {formatCountryLabel(join.country_code) ?? "Earth"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Telemetry Components ───────────────────────────────────────────────────

function TelemetryMetricTile({
  accent,
  label,
  value,
}: {
  accent: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[0.95rem] border border-white/6 bg-[linear-gradient(180deg,rgba(8,15,30,0.94),rgba(16,23,40,0.78))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-[#6f809b]">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm font-semibold" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

function CountryTelemetryPanel({
  countries,
  totalCountries,
}: {
  countries: MissionOverview["top_countries"];
  totalCountries: number;
}) {
  const rankedCountries = countries.slice(0, 6);
  const maxContributions = Math.max(
    1,
    ...rankedCountries.map((country) => country.total_contributions),
  );
  const leadDistanceKm = rankedCountries[0]?.total_distance_km ?? 0;

  return (
    <HudPanel
      title="Rhythms By Country"
      accentColor={SIGNAL_CYAN}
      className="shadow-[0_20px_50px_rgba(0,0,0,0.26)]"
      icon={<Globe2 size={14} />}
    >
      <div className="grid grid-cols-2 gap-2">
        <TelemetryMetricTile
          accent="#63E7FF"
          label="Visible"
          value={totalCountries.toLocaleString()}
        />
        <TelemetryMetricTile
          accent="#A78BFA"
          label="Lead Distance"
          value={formatMissionDistance(leadDistanceKm)}
        />
      </div>

      {rankedCountries.length > 0 ? (
        <div className="mt-3 space-y-2">
          {rankedCountries.map((country, index) => {
            const countryLabel = formatCountryLabel(country.country_code) ?? country.country_code;
            const ratio = country.total_contributions / maxContributions;

            return (
              <div
                key={country.country_code}
                className="rounded-[1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(8,15,30,0.88),rgba(13,19,34,0.7))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5b6b84]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-medium text-[#F9FAFB]">
                        {countryLabel}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-[#9FB4D9]">
                        {country.total_contributions.toLocaleString()} joins
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[#18243a]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#00D4FF,#7C3AED)]"
                        style={{ width: `${Math.max(10, ratio * 100)}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] text-[#6F809B]">
                      <span>{country.country_code}</span>
                      <span className="text-[#63E7FF]">
                        {formatMissionDistance(country.total_distance_km)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-[11px] leading-relaxed text-[#7B8BA4]">
          Country telemetry will illuminate here as public mission joins arrive.
        </p>
      )}
    </HudPanel>
  );
}

function ActivityTelemetryPanel({ activityStats }: { activityStats: MissionActivityStats }) {
  const [scope, setScope] = useState<ActivityScope>("daily");
  const points = activityStats[scope];
  const totalJoins = points.reduce((sum, point) => sum + point.contributions, 0);
  const totalDistanceM = points.reduce((sum, point) => sum + point.distance_m, 0);
  const peakJoins = Math.max(0, ...points.map((point) => point.contributions));
  const maxJoins = Math.max(1, peakJoins);
  const labelStride =
    scope === "hourly" ? 3 : scope === "daily" ? 4 : scope === "weekly" ? 3 : 2;

  return (
    <HudPanel
      title="Rhythm Routine"
      accentColor={SUCCESS_GREEN}
      className="shadow-[0_20px_50px_rgba(0,0,0,0.26)]"
      icon={<Signal size={14} />}
    >
      <div className="flex rounded-full border border-white/8 bg-[#101828]/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        {(["hourly", "daily", "weekly", "monthly"] as ActivityScope[]).map((candidate) => {
          const active = candidate === scope;
          return (
            <button
              key={candidate}
              className={[
                "flex-1 rounded-full px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] transition-all",
                active
                  ? "bg-[linear-gradient(90deg,rgba(0,212,255,0.18),rgba(124,58,237,0.18))] text-[#F9FAFB] shadow-[0_0_0_1px_rgba(99,231,255,0.14)]"
                  : "text-[#71839F] hover:text-[#E6F7FF]",
              ].join(" ")}
              onClick={() => setScope(candidate)}
              type="button"
            >
              {candidate}
            </button>
          );
        })}
      </div>

      {points.length > 0 ? (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <TelemetryMetricTile accent="#63E7FF" label="Joins" value={totalJoins.toLocaleString()} />
            <TelemetryMetricTile accent="#10B981" label="Peak" value={peakJoins.toLocaleString()} />
            <TelemetryMetricTile
              accent="#A78BFA"
              label="Distance"
              value={formatMissionMeters(totalDistanceM)}
            />
          </div>

          <div
            className="mt-4 grid h-[108px] items-end gap-1.5"
            style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
          >
            {points.map((point, index) => {
              const height = `${Math.max(10, (point.contributions / maxJoins) * 100)}%`;
              const showLabel =
                index === 0 || index === points.length - 1 || index % labelStride === 0;

              return (
                <div key={point.bucket_key} className="flex h-full flex-col justify-end gap-1">
                  <div className="relative h-[84px] rounded-t-full rounded-b-[0.65rem] bg-[#121b30] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div
                      className="absolute inset-x-[2px] bottom-[2px] rounded-t-full rounded-b-[0.55rem] bg-[linear-gradient(180deg,rgba(124,58,237,0.9),rgba(0,212,255,0.94))] shadow-[0_0_18px_rgba(0,212,255,0.15)]"
                      style={{ height }}
                    />
                  </div>
                  <span
                    className={[
                      "text-center font-mono text-[8px] uppercase tracking-[0.16em] text-[#64748B]",
                      showLabel ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                  >
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="mt-3 text-[11px] leading-relaxed text-[#7B8BA4]">
          Rhythm connections by the hour.
        </p>
      )}
    </HudPanel>
  );
}

function SignalTypeTelemetryPanel({
  rhythmTypeStats,
}: {
  rhythmTypeStats: MissionRhythmTypeStats;
}) {
  const visibleTypes = rhythmTypeStats.types.slice(0, 6);
  const maxCount = Math.max(1, ...visibleTypes.map((entry) => entry.count));
  const totalSignals = rhythmTypeStats.types.reduce((sum, entry) => sum + entry.count, 0);
  const totalDistanceM = rhythmTypeStats.types.reduce(
    (sum, entry) => sum + entry.total_distance_m,
    0,
  );

  return (
    <HudPanel
      title="Signal Type"
      accentColor={PULSE_RED}
      className="shadow-[0_20px_50px_rgba(0,0,0,0.26)]"
      icon={<Heart size={14} />}
    >
      <div className="grid grid-cols-2 gap-2">
        <TelemetryMetricTile accent="#FF5D78" label="Total Signals" value={totalSignals.toLocaleString()} />
        <TelemetryMetricTile
          accent="#63E7FF"
          label="Distance"
          value={formatMissionMeters(totalDistanceM)}
        />
      </div>

      {visibleTypes.length > 0 ? (
        <div className="mt-3 space-y-2">
          {visibleTypes.map((entry) => {
            const ratio = entry.count / maxCount;
            const color = RHYTHM_TYPE_COLORS[entry.type] ?? TEXT_TERTIARY;

            return (
              <div
                key={entry.type}
                className="rounded-[1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(8,15,30,0.88),rgba(13,19,34,0.7))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_12px_currentColor]"
                    style={{ backgroundColor: color, color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-medium text-[#F9FAFB]">
                        {formatReadableLabel(entry.type)}
                      </span>
                      <span className="shrink-0 font-mono text-[9px] text-[#7B8BA4]">
                        {entry.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[#18243a]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(10, ratio * 100)}%`,
                          background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.92))`,
                        }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] text-[#6F809B]">
                      <span>{entry.count.toLocaleString()} joins</span>
                      <span className="text-[#F9FAFB]">
                        {formatMissionMeters(entry.total_distance_m)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-[11px] leading-relaxed text-[#7B8BA4]">
          Signal telemetry will populate once the mission receives verified joins.
        </p>
      )}
    </HudPanel>
  );
}

function GroundStationPanel({
  countriesRepresented,
  earthPct,
  moonPct,
  recentContributionCount24h,
  totalContributions,
}: {
  countriesRepresented: number;
  earthPct: number;
  moonPct: number;
  recentContributionCount24h: number;
  totalContributions: number;
}) {
  return (
    <HudPanel
      title="Ground Station"
      accentColor={SUCCESS_GREEN}
      className="shadow-[0_20px_50px_rgba(0,0,0,0.26)]"
      icon={<Signal size={14} />}
    >
      <div className="space-y-3.5">
        <div className="rounded-[1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(8,15,30,0.88),rgba(12,18,34,0.72))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#6f809b]">
              Earth loop
            </span>
            <span className="font-mono text-xs font-semibold text-[#63E7FF]">
              {earthPct.toFixed(2)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-[#18243a]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#63E7FF,#3EB5FF)]"
              style={{ width: `${Math.min(earthPct, 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-[1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(8,15,30,0.88),rgba(12,18,34,0.72))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#6f809b]">
              Moon transit
            </span>
            <span className="font-mono text-xs font-semibold text-[#A78BFA]">
              {moonPct.toFixed(4)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-[#18243a]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#7C3AED,#B692FF)]"
              style={{ width: `${Math.min(moonPct * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TelemetryMetricTile
            accent="#F9FAFB"
            label="Rhythms"
            value={totalContributions.toLocaleString()}
          />
          <TelemetryMetricTile
            accent="#F9FAFB"
            label="Countries"
            value={countriesRepresented.toLocaleString()}
          />
        </div>

        <div className="rounded-[1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(8,15,30,0.88),rgba(12,18,34,0.72))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <DataLabel>Last 24h</DataLabel>
          <div className="mt-1 font-mono text-lg font-semibold text-[#10B981]">
            +{recentContributionCount24h.toLocaleString()} rhythms
          </div>
        </div>
      </div>
    </HudPanel>
  );
}

function LiveFeedPanel({ overview }: { overview: MissionOverview }) {
  return (
    <HudPanel
      title="Rhythm Strip"
      accentColor={AURORA_VIOLET}
      className="shadow-[0_20px_50px_rgba(0,0,0,0.26)]"
      icon={<Heart size={14} />}
    >
      {overview.recent_joins.length > 0 ? (
        <div className="mission-scrollbar max-h-[182px] space-y-2 overflow-y-auto scrollbar-thin">
          {overview.recent_joins.slice(0, 10).map((join, index) => (
            <div
              key={join.contribution_id}
              className="rounded-[1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(8,15,30,0.88),rgba(13,19,34,0.7))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <div className="flex items-center gap-2">
                {join.art_preview?.thumb_url ? (
                  <img
                    src={join.art_preview.thumb_url}
                    alt=""
                    className="h-9 w-9 rounded-[0.85rem] border border-white/10 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-[0.85rem] border border-white/8 bg-[#121b30]">
                    <Heart className="h-4 w-4 text-[#5c6d86]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-medium text-[#F9FAFB]">
                      {join.display_name ?? "Anonymous"}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#5c6d86]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 font-mono text-[9px] text-[#6F809B]">
                    <span className="truncate">
                      {formatCountryLabel(join.country_code) ?? "Earth"}
                    </span>
                    <span className="text-[#FF5D78]">{formatMissionMeters(join.distance_m)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 font-mono text-[8px] uppercase tracking-[0.18em] text-[#5c6d86]">
                {formatRelativeJoinTime(join.joined_at)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-3 text-center text-[11px] leading-relaxed text-[#7B8BA4]">
          Rhythm connections arrive here.
        </p>
      )}
    </HudPanel>
  );
}

function NextMilestonePanel({
  distanceRemainingM,
  milestone,
  progress,
}: {
  distanceRemainingM: number | null | undefined;
  milestone: MissionOverview["milestone_state"]["next"] | null | undefined;
  progress: number;
}) {
  if (!milestone) {
    return null;
  }

  return (
    <HudPanel
      title="Next Milestone"
      accentColor={AURORA_VIOLET}
      className="shadow-[0_20px_50px_rgba(0,0,0,0.26)]"
      icon={<Milestone size={14} />}
    >
      <div className="rounded-[1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(8,15,30,0.88),rgba(13,19,34,0.7))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="font-display text-[1.15rem] leading-none tracking-[-0.03em] text-[#F9FAFB]">
          {milestone.label}
        </div>
        {distanceRemainingM != null && distanceRemainingM > 0 ? (
          <>
            <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#7B8BA4]">
              <span>{formatMissionMeters(distanceRemainingM)} remaining</span>
              <span className="text-[#8b68ff]">{progress.toFixed(0)}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[#18243a]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#7C3AED,#B692FF)] transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : null}
      </div>
    </HudPanel>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function MissionControlShell({
  initialActivityStats,
  initialOverview,
  initialRhythmTypeStats,
  initialRouteGeometry,
  initialSegmentsWindow,
  initialNearProgressWindow,
  initialMilestoneLocalWindow,
  initialCountryHighlightWindow,
}: MissionControlShellProps) {
  const { overview, transport } = useMissionLiveOverview(initialOverview);
  const hasMissionActivity = overview.aggregate.total_contributions > 0;
  const rawReducedMotion = useReducedMotion();

  // ─── Segment windows ───────────────────────────────────────────────
  const recentSegmentsWindow = useMissionSegmentsWindow(
    initialSegmentsWindow,
    overview.snapshot_version,
    "recent",
    initialSegmentsWindow.limit,
  );
  const nearProgressSeed =
    initialNearProgressWindow ??
    buildEmptyMissionSegmentsWindow("near_progress", Math.min(initialSegmentsWindow.limit, 44));
  const milestoneLocalSeed =
    initialMilestoneLocalWindow ??
    buildEmptyMissionSegmentsWindow("milestone_local", Math.min(initialSegmentsWindow.limit, 24));
  const countryHighlightSeed =
    initialCountryHighlightWindow ??
    buildEmptyMissionSegmentsWindow("country_highlights", Math.min(initialSegmentsWindow.limit, 18));
  const nearProgressWindow = useMissionSegmentsWindow(
    nearProgressSeed,
    overview.snapshot_version,
    "near_progress",
    nearProgressSeed.limit,
  );
  const milestoneLocalWindow = useMissionSegmentsWindow(
    milestoneLocalSeed,
    overview.snapshot_version,
    "milestone_local",
    milestoneLocalSeed.limit,
  );
  const countryHighlightWindow = useMissionSegmentsWindow(
    countryHighlightSeed,
    overview.snapshot_version,
    "country_highlights",
    countryHighlightSeed.limit,
  );

  // ─── Client-side state ─────────────────────────────────────────────
  const [hasMounted, setHasMounted] = useState(false);
  const prefersReducedMotion = hasMounted && Boolean(rawReducedMotion);
  const [canRenderScene, setCanRenderScene] = useState(false);
  const [compactViewport, setCompactViewport] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [inspectMode, setInspectMode] = useState(false);
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [sceneQualityMode, setSceneQualityMode] = useState<"balanced" | "conservative">("balanced");
  const [scenePreference, setScenePreference] = useState<"auto" | "fallback" | "scene">("auto");
  const [focusedWaypointKey, setFocusedWaypointKey] = useState<string | null>("tampa");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // ─── Viewport detection ────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const compactQuery = window.matchMedia("(max-width: 960px)");
    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const applyCapabilities = () => {
      setCanRenderScene(supportsWebgl());
      setCompactViewport(compactQuery.matches || pointerQuery.matches);
      setCoarsePointer(pointerQuery.matches);
    };

    applyCapabilities();
    compactQuery.addEventListener?.("change", applyCapabilities);
    pointerQuery.addEventListener?.("change", applyCapabilities);

    return () => {
      compactQuery.removeEventListener?.("change", applyCapabilities);
      pointerQuery.removeEventListener?.("change", applyCapabilities);
    };
  }, []);

  useEffect(() => {
    setSceneQualityMode(prefersReducedMotion ? "conservative" : "balanced");
  }, [prefersReducedMotion]);

  useEffect(() => {
    const currentWaypoint =
      getMissionMilestoneMarkerByKey(
        initialRouteGeometry,
        overview.milestone_state.current?.key ?? null,
      )?.waypoint_key ??
      initialRouteGeometry.waypoints.find(
        (waypoint) => waypoint.milestone_key === overview.milestone_state.current?.key,
      )?.key ??
      null;
    if (focusedWaypointKey === null || focusedWaypointKey === "tampa") {
      setFocusedWaypointKey(hasMissionActivity ? currentWaypoint ?? "tampa" : "tampa");
    }
  }, [
    focusedWaypointKey,
    hasMissionActivity,
    initialRouteGeometry.waypoints,
    overview.milestone_state.current?.key,
  ]);

  // ─── Fallback logic ────────────────────────────────────────────────
  const fallbackReason =
    sceneError
      ? "scene_error"
      : !canRenderScene
        ? "webgl_unavailable"
        : scenePreference === "fallback"
          ? "user_selected"
          : compactViewport && scenePreference !== "scene"
            ? coarsePointer
              ? "coarse_pointer_default"
              : "compact_default"
            : null;

  const shouldShowFallback = fallbackReason !== null;

  const { handleSceneError, handleSceneInteraction, handleSceneLoaded } = useMissionSceneTelemetry({
    compactView: compactViewport,
    coarsePointer,
    fallbackReason,
    reducedMotion: prefersReducedMotion,
    transport,
    webglSupported: canRenderScene,
  });

  function onSceneLoaded(payload: {
    fpsEstimate: number;
    performanceTier: MissionScenePerformanceTier;
  }) {
    if (payload.performanceTier === "conservative") {
      setSceneQualityMode("conservative");
    }
    handleSceneLoaded(payload);
  }

  // ─── Derived values ────────────────────────────────────────────────
  const earthPct = overview.aggregate.earth_progress_pct;
  const moonPct = overview.aggregate.moon_progress_pct;
  const nextMilestone = overview.milestone_state.next;
  const totalContributions = overview.aggregate.total_contributions;
  const totalDistanceKm = overview.aggregate.total_distance_km;
  const activityStats = initialActivityStats ?? buildEmptyMissionActivityStats();
  const rhythmTypeStats = initialRhythmTypeStats ?? buildEmptyMissionRhythmTypeStats();

  // Next milestone progress
  const nextMilestoneProgress = useMemo(() => {
    if (!nextMilestone) return 0;
    const distRemaining = overview.aggregate.distance_to_next_milestone_m ?? 0;
    const thresholdM = nextMilestone.distance_threshold_m;
    const currentMilestoneThreshold = overview.milestone_state.current?.distance_threshold_m ?? 0;
    const totalSpan = thresholdM - currentMilestoneThreshold;
    if (totalSpan <= 0) return 100;
    const covered = totalSpan - distRemaining;
    return Math.min(100, Math.max(0, (covered / totalSpan) * 100));
  }, [nextMilestone, overview.aggregate.distance_to_next_milestone_m, overview.milestone_state.current]);

  // ─── Globe scene element ───────────────────────────────────────────
  const globeScene = shouldShowFallback ? (
    <MissionFallbackField />
  ) : (
    <MissionSceneErrorBoundary
      key={sceneError ? "scene-error" : "scene-live"}
      onError={(error) => {
        setSceneError(error.message);
        handleSceneError("scene_render_failed");
      }}
    >
      <MissionControlScene
        detailMode={sceneQualityMode}
        focusedWaypointKey={focusedWaypointKey}
        inspectMode={inspectMode}
        onSceneLoaded={onSceneLoaded}
        overview={overview}
        reducedMotion={prefersReducedMotion}
        routeGeometry={initialRouteGeometry}
        segmentsWindows={{
          recent: recentSegmentsWindow,
          nearProgress: nearProgressWindow,
          milestoneLocal: milestoneLocalWindow,
          countryHighlights: countryHighlightWindow,
        }}
      />
    </MissionSceneErrorBoundary>
  );

  // ─── MOBILE LAYOUT (<960px) ────────────────────────────────────────
  if (compactViewport) {
    return (
      <main className="min-h-screen bg-[#0A0E1A]">
        {/* Compact top bar */}
        <div className="flex h-12 items-center justify-between border-b border-[#374151] bg-[#111827]/95 px-4 backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-2" aria-label="OneRhythm home">
            <span className="font-display text-lg font-bold">
              <span className="text-[#F9FAFB]">One</span>
              <span className="text-[#FF2D55]">Rhythm</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-[#F9FAFB]">
              {formatMissionDistance(totalDistanceKm)}
            </span>
            <span
              aria-hidden="true"
              className={[
                "h-2 w-2 rounded-full",
                transport === "live"
                  ? "bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.4)] animate-pulse"
                  : "bg-[#6B7280]",
              ].join(" ")}
            />
          </div>
        </div>

        {/* Globe monitor */}
      <div className="relative mx-3 mt-3 h-[50vh] overflow-hidden rounded-lg border border-[#374151] bg-[#0A0E1A]">
        {!shouldShowFallback ? (
          <div className="absolute right-3 top-3 z-30 flex items-center gap-2">
            <button
              className={[
                "rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors",
                inspectMode
                  ? "border-[#63E7FF] bg-[#63E7FF]/10 text-[#E8FBFF]"
                  : "border-[#374151] bg-[#111827]/75 text-[#9CA3AF] hover:border-[#63E7FF]/45 hover:text-[#E8FBFF]",
              ].join(" ")}
              onClick={() => {
                const nextInspectMode = !inspectMode;
                setInspectMode(nextInspectMode);
                handleSceneInteraction(
                  nextInspectMode ? "inspect_mode_enabled" : "inspect_mode_disabled",
                  focusedWaypointKey,
                );
              }}
              type="button"
            >
              {inspectMode ? "Observe view" : "Inspect view"}
            </button>
          </div>
        ) : null}
        <div className="absolute inset-0">{globeScene}</div>
        <div className="absolute top-3 left-1/2 z-20 -translate-x-1/2 text-center">
          <DataLabel>Rhythms Connected</DataLabel>
          <div className="font-mono text-2xl font-bold text-[#FF2D55]">
            {totalContributions.toLocaleString()}
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-20 border-t border-[#374151] bg-[#1A1F35]/85 p-3 backdrop-blur-sm">
            <DataLabel>Mission Data</DataLabel>
            <div className="mt-2 h-2 rounded-full bg-[#374151]">
              <div className="h-full rounded-full bg-[#FF2D55]" style={{ width: `${earthPct}%` }} />
            </div>
            <div className="mt-1 font-mono text-[10px] text-[#9CA3AF]">
              {earthPct.toFixed(1)}% Earth circumnavigation
            </div>
          </div>
        </div>

        {/* Key metrics — horizontal scroll */}
        <div className="mission-scrollbar flex gap-2 overflow-x-auto px-3 py-3 scrollbar-thin">
          <div className="shrink-0 rounded-lg border border-[#374151] bg-[#1A1F35]/90 p-3">
            <DataLabel>Distance</DataLabel>
            <div className="mt-1 font-mono text-sm font-bold text-[#00D4FF]">
              {formatMissionDistance(totalDistanceKm)}
            </div>
          </div>
          <div className="shrink-0 rounded-lg border border-[#374151] bg-[#1A1F35]/90 p-3">
            <DataLabel>Rhythms</DataLabel>
            <div className="mt-1 font-mono text-sm font-bold text-[#FF2D55]">
              {totalContributions.toLocaleString()}
            </div>
          </div>
          <div className="shrink-0 rounded-lg border border-[#374151] bg-[#1A1F35]/90 p-3">
            <DataLabel>Countries</DataLabel>
            <div className="mt-1 font-mono text-sm font-bold text-[#10B981]">
              {overview.aggregate.countries_represented.toLocaleString()}
            </div>
          </div>
          <div className="shrink-0 rounded-lg border border-[#374151] bg-[#1A1F35]/90 p-3">
            <DataLabel>Earth</DataLabel>
            <div className="mt-1 font-mono text-sm font-bold text-[#7C3AED]">
              {earthPct.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Rhythm chain strip */}
        <div className="mx-3 h-[100px] overflow-hidden rounded-lg border border-[#374151] bg-[#111827]/95">
          <RhythmChainStrip overview={overview} />
        </div>

        <div className="mx-3 mt-3 space-y-3 pb-20">
          <GroundStationPanel
            countriesRepresented={overview.aggregate.countries_represented}
            earthPct={earthPct}
            moonPct={moonPct}
            recentContributionCount24h={overview.recent_contribution_count_24h}
            totalContributions={totalContributions}
          />
          <CountryTelemetryPanel
            countries={overview.top_countries}
            totalCountries={overview.aggregate.countries_represented}
          />
          <LiveFeedPanel overview={overview} />
          <NextMilestonePanel
            distanceRemainingM={overview.aggregate.distance_to_next_milestone_m}
            milestone={nextMilestone}
            progress={nextMilestoneProgress}
          />
          <ActivityTelemetryPanel activityStats={activityStats} />
          <SignalTypeTelemetryPanel rhythmTypeStats={rhythmTypeStats} />
        </div>

        {/* Join CTA */}
        <div className="sticky bottom-0 z-50 border-t border-[#374151] bg-[#111827]/95 p-3 backdrop-blur-sm">
          <Link
            href="/join"
            className="block w-full rounded-md bg-[#FF2D55] py-3 text-center text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(255,45,85,0.3)]"
          >
            Join the Mission
          </Link>
        </div>
      </main>
    );
  }

  // ─── DESKTOP LAYOUT — Full-viewport CSS Grid ──────────────────────
  return (
    <main
      className="h-screen w-screen overflow-hidden bg-[#0A0E1A]"
      style={{
        display: "grid",
        gridTemplateRows: "56px 1fr 100px 56px",
        gridTemplateColumns: "300px 1fr 320px",
        gridTemplateAreas: `
          "topbar    topbar    topbar"
          "left      center    right"
          "chain     chain     chain"
          "bottombar bottombar bottombar"
        `,
      }}
    >
      {/* ═══ TOP BAR ═══ */}
      <div
        className="z-50 flex items-center gap-4 border-b border-[#374151] bg-[#111827]/95 px-4 backdrop-blur-sm"
        style={{ gridArea: "topbar" }}
      >
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2" aria-label="OneRhythm home">
          <span className="font-display text-xl font-bold">
            <span className="text-[#F9FAFB]">One</span>
            <span className="text-[#FF2D55]">Rhythm</span>
          </span>
        </Link>

        {/* Heart icon */}
        <span className="flex items-center" aria-hidden="true">
          <Heart
            className="h-5 w-5 animate-[heartbeatIcon_1.2s_ease-in-out_infinite] motion-reduce:animate-none"
            fill="url(#topbar-heart-grad-mc)"
            stroke="none"
          />
          <svg className="h-0 w-0" aria-hidden="true">
            <defs>
              <linearGradient id="topbar-heart-grad-mc" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#FF2D55" />
                <stop offset="50%" stopColor="#CC1A3D" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
        </span>

        {/* Distance counter */}
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold text-[#F9FAFB]">
            {formatMissionDistance(totalDistanceKm)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#9CA3AF]">
            Shared distance
          </span>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={[
              "h-2 w-2 rounded-full",
              transport === "live"
                ? "bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                : transport === "polling"
                  ? "bg-[#FF2D55] shadow-[0_0_6px_rgba(255,45,85,0.3)]"
                  : "bg-[#6B7280]",
            ].join(" ")}
          />
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#9CA3AF]">
            {transport === "live" ? "Live" : transport === "polling" ? "Polling" : "Connecting"}
          </span>
        </div>

        {/* Live clock */}
        <div className="hidden items-center gap-2 lg:flex">
          <DataLabel>UTC</DataLabel>
          <LiveClock />
        </div>

        <div className="flex-1" />

        {/* Nav */}
        <div className="flex items-center gap-1">
          <Link
            href="/mission"
            className="rounded-md p-2 text-[#9CA3AF] transition-colors hover:text-[#00D4FF]"
            aria-label="Mission"
          >
            <Globe2 className="h-4 w-4" />
          </Link>
          <Link
            href="/learn"
            className="rounded-md p-2 text-[#9CA3AF] transition-colors hover:text-[#00D4FF]"
            aria-label="Learn"
          >
            <BookOpen className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ═══ LEFT PANEL ═══ */}
      <div
        className="mission-scrollbar z-40 space-y-2 overflow-y-auto border-r border-[#374151] bg-[#0A0E1A] p-2 scrollbar-thin"
        style={{ gridArea: "left" }}
      >
        {/* Join the Mission */}
        <HudPanel title="Join the Mission" accentColor={PULSE_RED} icon={<Rocket size={14} />}>
          <p className="text-[11px] leading-relaxed text-[#9CA3AF]">
            Add your rhythm. Every contribution moves us forward.
          </p>
          <Link
            href="/join"
            className="mt-2 flex items-center gap-2 rounded-md bg-[#FF2D55] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_16px_rgba(255,45,85,0.25)] transition-all hover:bg-[#CC1A3D] hover:shadow-[0_0_24px_rgba(255,45,85,0.4)]"
          >
            Join Now <ArrowRight className="h-3 w-3" />
          </Link>
        </HudPanel>

        <GroundStationPanel
          countriesRepresented={overview.aggregate.countries_represented}
          earthPct={earthPct}
          moonPct={moonPct}
          recentContributionCount24h={overview.recent_contribution_count_24h}
          totalContributions={totalContributions}
        />

        <CountryTelemetryPanel
          countries={overview.top_countries}
          totalCountries={overview.aggregate.countries_represented}
        />
      </div>

      {/* ═══ CENTER — Globe Monitor ═══ */}
      <div className="relative z-30" style={{ gridArea: "center" }}>
        <div className="flex-1 relative m-2 h-[calc(100%-16px)]">
          <div className="absolute inset-0 overflow-hidden rounded-[1.45rem] border border-[#26344f] bg-[radial-gradient(circle_at_18%_16%,rgba(99,231,255,0.08),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(139,104,255,0.12),transparent_22%),linear-gradient(180deg,#08101e_0%,#060b16_100%)] shadow-[0_28px_90px_rgba(4,8,18,0.56)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "radial-gradient(circle at 50% 100%, rgba(255,93,120,0.08), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.02), transparent 22%)",
              }}
            />
            {!shouldShowFallback ? (
              <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
                <button
                  className={[
                    "rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors",
                    inspectMode
                      ? "border-[#63E7FF] bg-[#63E7FF]/10 text-[#E8FBFF]"
                      : "border-[#374151] bg-[#111827]/72 text-[#9CA3AF] hover:border-[#63E7FF]/45 hover:text-[#E8FBFF]",
                  ].join(" ")}
                  onClick={() => {
                    const nextInspectMode = !inspectMode;
                    setInspectMode(nextInspectMode);
                    handleSceneInteraction(
                      nextInspectMode ? "inspect_mode_enabled" : "inspect_mode_disabled",
                      focusedWaypointKey,
                    );
                  }}
                  type="button"
                >
                  {inspectMode ? "Observe view" : "Inspect view"}
                </button>
              </div>
            ) : null}
            {/* "TOTAL CONTRIBUTIONS" header */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 text-center">
              <DataLabel>Rhythms Connected</DataLabel>
              <div className="text-2xl font-mono font-bold text-[#FF2D55]">
                {totalContributions.toLocaleString()}
              </div>
            </div>

            {/* The 3D Globe */}
            <div className="absolute inset-0">{globeScene}</div>

            {/* Mission data overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#1A1F35]/85 backdrop-blur-sm border-t border-[#374151] p-3">
              <div className="flex items-center justify-between">
                <DataLabel>Mission Data</DataLabel>
                <span className="font-mono text-[10px] text-[#9CA3AF]">
                  {formatMissionDistance(totalDistanceKm)} traversed
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#374151]">
                <div
                  className="h-full rounded-full bg-[#FF2D55] transition-all duration-700"
                  style={{ width: `${Math.min(earthPct, 100)}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#9CA3AF]">
                  {earthPct.toFixed(1)}% Earth circumnavigation
                </span>
                <span className="font-mono text-[10px] text-[#7C3AED]">
                  {moonPct.toFixed(4)}% to Moon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <div
        className="mission-scrollbar z-40 space-y-2 overflow-y-auto border-l border-[#374151] bg-[#0A0E1A] p-2 scrollbar-thin"
        style={{ gridArea: "right" }}
      >
        <LiveFeedPanel overview={overview} />
        <NextMilestonePanel
          distanceRemainingM={overview.aggregate.distance_to_next_milestone_m}
          milestone={nextMilestone}
          progress={nextMilestoneProgress}
        />
        <ActivityTelemetryPanel activityStats={activityStats} />
        <SignalTypeTelemetryPanel rhythmTypeStats={rhythmTypeStats} />
      </div>

      {/* ═══ RHYTHM CHAIN STRIP ═══ */}
      <div
        className="z-40 border-y border-[#374151] bg-[#111827]/95 backdrop-blur-sm"
        style={{ gridArea: "chain" }}
      >
        <RhythmChainStrip overview={overview} />
      </div>

      {/* ═══ BOTTOM BAR ═══ */}
      <div
        className="z-50 flex items-center gap-6 border-t border-[#374151] bg-[#111827]/95 px-4 backdrop-blur-sm"
        style={{ gridArea: "bottombar" }}
      >
        {/* Mission status */}
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={[
              "h-2 w-2 rounded-full",
              transport === "live" ? "bg-[#10B981] animate-pulse" : "bg-[#6B7280]",
            ].join(" ")}
          />
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#9CA3AF]">
            Mission active
          </span>
        </div>

        {/* Destination */}
        <div className="hidden sm:block">
          <DataLabel>Destination</DataLabel>
          <div className="font-mono text-xs text-[#F9FAFB]">Moon</div>
        </div>

        {/* Coordinates */}
        <div className="hidden md:block">
          <DataLabel>Origin</DataLabel>
          <div className="font-mono text-xs text-[#9CA3AF]">
            27.9506&deg;N 82.4572&deg;W
          </div>
        </div>

        {/* Live clock */}
        <div className="hidden lg:block">
          <DataLabel>Live Time</DataLabel>
          <LiveClock className="font-mono text-sm font-bold tracking-wider text-[#F9FAFB]" />
        </div>

        <div className="flex-1" />

        {/* Join CTA */}
        <Link
          href="/join"
          className="min-h-[36px] rounded-md bg-[#FF2D55] px-5 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(255,45,85,0.3)] transition-all hover:bg-[#CC1A3D] hover:shadow-[0_0_30px_rgba(255,45,85,0.5)]"
        >
          Join the Mission
        </Link>
      </div>
    </main>
  );
}
