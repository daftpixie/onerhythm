import type { ReactNode, SelectHTMLAttributes } from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
};

export function Select({ children, className = "", ...props }: SelectProps) {
  return (
    <select
      className={[
        "min-h-11 w-full rounded-md border border-token bg-void-midnight/92 px-3.5 py-2.5",
        "font-body text-base leading-6 text-text-primary",
        "transition-colors duration-micro ease-out",
        "hover:border-signal/35",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </select>
  );
}
