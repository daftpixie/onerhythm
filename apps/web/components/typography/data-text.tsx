import { cn } from "../../lib/cn";

interface DataTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
  gradient?: boolean;
}

const sizeMap = {
  sm: "text-[14px]",
  md: "text-[16px]",
  lg: "text-[18px]",
};

export function DataText({
  size = "md",
  gradient = false,
  className,
  children,
  ...props
}: DataTextProps) {
  return (
    <span
      className={cn(
        "font-mono leading-[1.3]",
        sizeMap[size],
        gradient && "bg-gradient-to-r from-cyan via-aurora to-pulse bg-clip-text text-transparent",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
