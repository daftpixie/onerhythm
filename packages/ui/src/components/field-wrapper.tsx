import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

export type FieldWrapperProps = {
  children: ReactNode;
  description?: string;
  error?: string;
  htmlFor: string;
  label: string;
};

export function FieldWrapper({
  children,
  description,
  error,
  htmlFor,
  label,
}: FieldWrapperProps) {
  const descriptionId = description ? `${htmlFor}-description` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const child = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{
          "aria-describedby"?: string;
          "aria-invalid"?: boolean;
        }>,
        {
          "aria-describedby": describedBy,
          "aria-invalid": error ? true : undefined,
        },
      )
    : children;

  return (
    <div className="space-y-2.5">
      <label
        className="font-body text-[0.8rem] font-medium uppercase tracking-[0.14em] text-text-secondary"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {description ? (
        <p className="max-w-[68ch] text-sm leading-6 text-text-tertiary" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {child}
      {error ? (
        <p aria-live="polite" className="text-sm leading-6 text-pulse" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
