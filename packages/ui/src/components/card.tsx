import type { HTMLAttributes, ReactNode } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        "surface-2 rounded-[1.5rem] border border-token p-6 shadow-panel",
        "backdrop-blur-[1px]",
        "transition-[background-color,box-shadow] duration-micro ease-out hover:bg-cosmos-nebula/80 hover:shadow-subtle",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
