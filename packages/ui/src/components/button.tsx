import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-pulse/60 bg-pulse text-text-primary shadow-pulse hover:border-pulse-dark hover:bg-pulse-dark focus-visible:ring-signal",
  secondary:
    "border border-signal/55 bg-cosmos-nebula/55 text-text-primary hover:border-signal hover:bg-cosmos-nebula/88 hover:text-signal-soft focus-visible:ring-signal",
  ghost:
    "border border-transparent text-text-secondary hover:border-token hover:bg-cosmos-nebula/72 hover:text-text-primary focus-visible:ring-signal",
  danger:
    "border border-warning/60 bg-warning/10 text-warning hover:bg-warning/20 hover:text-[#ffd38a] focus-visible:ring-warning",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-[0.9rem] px-4 py-2.5",
        "font-body text-sm font-medium leading-none transition-colors duration-micro ease-out",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void",
        variantClasses[variant],
        className,
      ].join(" ")}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
