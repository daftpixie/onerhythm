import { cn } from "../../lib/cn";

interface SectionWrapperProps extends React.HTMLAttributes<HTMLElement> {
  as?: "section" | "div";
  width?: "default" | "narrow" | "wide";
  bg?: "void" | "midnight" | "cosmos";
}

const widthMap = {
  default: "max-w-6xl",
  narrow: "max-w-4xl",
  wide: "max-w-7xl",
};

const bgMap = {
  void: "bg-void",
  midnight: "bg-midnight",
  cosmos: "bg-cosmos",
};

export function SectionWrapper({
  as: Tag = "section",
  width = "default",
  bg,
  className,
  children,
  ...props
}: SectionWrapperProps) {
  return (
    <Tag
      className={cn(
        "py-20 md:py-28",
        bg && bgMap[bg],
        className
      )}
      {...props}
    >
      <div className={cn(widthMap[width], "mx-auto px-6")}>
        {children}
      </div>
    </Tag>
  );
}
