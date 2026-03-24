import type { ReactNode } from "react";

interface HudPanelProps {
  title: string;
  accentColor?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function HudPanel({ title, accentColor = "#374151", icon, children, className }: HudPanelProps) {
  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[1.15rem] border border-[#2d3950] bg-[linear-gradient(180deg,rgba(21,28,48,0.96),rgba(14,19,33,0.92))] shadow-[0_22px_44px_rgba(2,6,14,0.34),inset_0_1px_0_rgba(255,255,255,0.035)] backdrop-blur-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] opacity-90"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(255,255,255,0.045), transparent 26%), radial-gradient(circle at bottom right, rgba(124,58,237,0.08), transparent 30%)",
        }}
      />
      <div className="relative p-3">
        <div className="mb-3 flex items-center gap-2">
          {icon ? (
            <span className="rounded-full border border-white/8 bg-white/4 p-1.5 text-[#9CA3AF]">
              {icon}
            </span>
          ) : null}
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#9CA3AF]">
            {title}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
