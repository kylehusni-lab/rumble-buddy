import { cn } from "@/lib/utils";

interface OTTMonogramProps {
  size?: "small" | "medium" | "large";
  showTagline?: boolean;
  className?: string;
}

export function OTTMonogram({
  size = "medium",
  showTagline = true,
  className,
}: OTTMonogramProps) {
  const sizes = {
    small: {
      text: "text-4xl",
      tagline: "text-[8px] tracking-[0.2em]",
    },
    medium: {
      text: "text-6xl sm:text-7xl",
      tagline: "text-xs tracking-[0.3em]",
    },
    large: {
      text: "text-8xl sm:text-9xl",
      tagline: "text-sm tracking-[0.4em]",
    },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "font-black leading-none tracking-tighter text-[#FDB81E]",
          s.text
        )}
        style={{ letterSpacing: "-0.05em" }}
      >
        OTT
      </div>
      {showTagline && (
        <div className={cn("font-semibold text-[#666666] mt-1", s.tagline)}>
          OVER THE TOP
        </div>
      )}
    </div>
  );
}
