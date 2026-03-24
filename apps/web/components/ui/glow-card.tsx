import { cn } from "../../lib/cn";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: "pulse" | "cyan" | "aurora";
  hoverable?: boolean;
}

export function GlowCard({
  children,
  className,
  glowColor = "cyan",
  hoverable = true,
  ...props
}: GlowCardProps) {
  const glowMap = {
    pulse: "hover:shadow-glow-pulse",
    cyan: "hover:shadow-glow-cyan",
    aurora: "hover:shadow-glow-aurora",
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-token bg-cosmos p-6",
        "transition-all duration-300 ease-out",
        hoverable && "hover:border-hover hover:bg-nebula",
        hoverable && glowMap[glowColor],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
