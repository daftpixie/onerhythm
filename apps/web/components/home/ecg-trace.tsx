"use client";

/**
 * Decorative ECG trace that sweeps across the bottom of the hero.
 * Purely decorative — not diagnostic, not derived from any ECG data.
 */
export function EcgTrace({ className }: { className?: string }) {
  // Stylized ECG waveform path (P-QRS-T shape, repeated)
  const wave =
    "M0,50 L40,50 L50,50 L55,48 L60,50 L70,50 L75,50 L78,30 L80,70 L82,15 L84,65 L86,45 L90,50 L100,50 L110,50 L115,46 L120,50 L130,50 L140,50";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden ${className ?? ""}`}
    >
      <svg
        className="h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 1400 100"
      >
        <defs>
          <linearGradient id="ecg-fade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--color-pulse)" stopOpacity="0" />
            <stop offset="20%" stopColor="var(--color-pulse)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="var(--color-pulse)" stopOpacity="0.2" />
            <stop offset="80%" stopColor="var(--color-pulse)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--color-pulse)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Render the waveform multiple times to span the full width */}
        <g stroke="url(#ecg-fade)" strokeWidth="1.5" fill="none">
          {Array.from({ length: 10 }).map((_, i) => (
            <path
              d={wave}
              key={i}
              transform={`translate(${i * 140}, 0)`}
            >
              <animateTransform
                attributeName="transform"
                dur="4s"
                from={`${i * 140 - 140}, 0`}
                repeatCount="indefinite"
                to={`${i * 140}, 0`}
                type="translate"
              />
            </path>
          ))}
        </g>
      </svg>
    </div>
  );
}
