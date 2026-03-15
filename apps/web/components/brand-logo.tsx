import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  priority?: boolean;
  size?: "header" | "hero" | "footer";
  variant?: "lockup" | "wordmark" | "mark";
  wordmarkTone?: "white" | "gradient";
  className?: string;
};

const sizeMap = {
  header: {
    mark: { width: 40, height: 40 },
    wordmark: { width: 220, height: 66 },
  },
  hero: {
    mark: { width: 56, height: 56 },
    wordmark: { width: 320, height: 96 },
  },
  footer: {
    mark: { width: 48, height: 48 },
    wordmark: { width: 260, height: 78 },
  },
} as const;

export function BrandLogo({
  href = "/",
  priority = false,
  size = "header",
  variant = "lockup",
  wordmarkTone = "white",
  className = "",
}: BrandLogoProps) {
  const dimensions = sizeMap[size];
  const wordmarkSrc =
    wordmarkTone === "gradient"
      ? "/brand/logos/onerhythm-full-gradient-800.png"
      : "/brand/logos/onerhythm-full-white.svg";

  return (
    <Link
      aria-label="OneRhythm home"
      className={[
        "inline-flex items-center gap-3 rounded-[0.9rem] px-2 py-2 transition-colors duration-micro ease-out",
        "hover:bg-cosmos-nebula focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-void",
        className,
      ].join(" ")}
      href={href}
    >
      {(variant === "lockup" || variant === "mark") && (
        <Image
          alt=""
          aria-hidden="true"
          className={
            size === "hero" ? "h-auto w-12 shrink-0 sm:w-14" : "h-auto w-8 shrink-0 sm:w-10"
          }
          height={dimensions.mark.height}
          priority={priority}
          src="/brand/logos/onerhythm-mark-white.svg"
          width={dimensions.mark.width}
        />
      )}
      {(variant === "lockup" || variant === "wordmark") && (
        <Image
          alt="OneRhythm"
          className={
            size === "hero"
              ? "h-auto w-[250px] max-w-full sm:w-[290px]"
              : size === "header"
                ? "h-auto w-[120px] max-w-full sm:w-[140px]"
                : "h-auto w-[156px] max-w-full sm:w-[178px]"
          }
          height={dimensions.wordmark.height}
          priority={priority}
          src={wordmarkSrc}
          width={dimensions.wordmark.width}
        />
      )}
      <span className="sr-only">OneRhythm</span>
    </Link>
  );
}
