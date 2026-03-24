import { cn } from "../../lib/cn";

type BadgeVariant = "default" | "pulse" | "cyan" | "aurora" | "success" | "warning" | "error";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-cosmos text-secondary border-[var(--color-border)]",
  pulse: "bg-pulse/10 text-pulse-glow border-pulse/20",
  cyan: "bg-cyan/10 text-cyan-soft border-cyan/20",
  aurora: "bg-aurora/10 text-aurora-glow border-aurora/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-error/10 text-error border-error/20",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5",
        "font-body text-caption font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
