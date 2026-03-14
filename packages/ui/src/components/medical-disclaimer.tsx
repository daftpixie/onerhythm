import type { HTMLAttributes } from "react";

export type MedicalDisclaimerProps = HTMLAttributes<HTMLDivElement>;

export function MedicalDisclaimer({
  className = "",
  ...props
}: MedicalDisclaimerProps) {
  return (
    <div
      aria-atomic="true"
      aria-label="Medical disclaimer"
      aria-live="polite"
      className={[
        "relative overflow-hidden rounded-[1.35rem] border border-warning/28 bg-cosmos-nebula/92 p-4 shadow-panel",
        "text-sm text-text-secondary",
        className,
      ].join(" ")}
      role="note"
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-warning"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-warning/10 blur-3xl"
      />
      <div className="relative flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-warning/40 bg-warning/10 font-mono text-[0.7rem] text-warning"
        >
          NOTE
        </span>
        <p className="max-w-[72ch] font-body text-sm leading-6">
          OneRhythm is an educational resource and community platform. It is not
          a medical device. It does not diagnose, treat, cure, or prevent any
          disease. The information provided is for educational purposes only and
          is not a substitute for professional medical advice, diagnosis, or
          treatment. Always consult your physician or qualified healthcare
          provider with any questions regarding a medical condition.
        </p>
      </div>
    </div>
  );
}
