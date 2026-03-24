import { cn } from "../../lib/cn";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
  size?: "display-xl" | "display-lg" | "display" | "heading-lg" | "heading" | "heading-sm";
  gradient?: boolean;
}

const sizeMap = {
  "display-xl": "text-display-xl font-display font-extrabold",
  "display-lg": "text-display-lg font-display font-bold",
  display: "text-display font-display font-semibold",
  "heading-lg": "text-heading-lg font-display font-semibold",
  heading: "text-heading font-display font-semibold",
  "heading-sm": "text-heading-sm font-display font-semibold",
};

export function Heading({
  as: Tag = "h2",
  size = "heading",
  gradient = false,
  className,
  children,
  ...props
}: HeadingProps) {
  return (
    <Tag
      className={cn(
        sizeMap[size],
        "text-primary tracking-tight",
        gradient && "bg-gradient-to-r from-cyan via-aurora to-pulse bg-clip-text text-transparent",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
