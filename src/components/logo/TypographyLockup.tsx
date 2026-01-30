import { cn } from "@/lib/utils";

interface TypographyLockupProps {
  layout?: "horizontal" | "stacked";
  showTagline?: boolean;
  color?: "default" | "inverse";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TypographyLockup({
  layout = "stacked",
  showTagline = true,
  color = "default",
  size = "md",
  className,
}: TypographyLockupProps) {
  const textColor = color === "default" ? "text-white" : "text-black";
  const taglineColor = color === "default" ? "text-[#999999]" : "text-[#666666]";
  
  const sizes = {
    sm: {
      overThe: "text-2xl",
      top: "text-3xl",
      bar: "w-16 h-0.5",
      tagline: "text-[10px] tracking-[0.3em]",
    },
    md: {
      overThe: "text-4xl sm:text-5xl",
      top: "text-5xl sm:text-6xl",
      bar: "w-24 sm:w-32 h-1",
      tagline: "text-xs sm:text-sm tracking-[0.4em]",
    },
    lg: {
      overThe: "text-6xl sm:text-7xl",
      top: "text-7xl sm:text-8xl",
      bar: "w-40 sm:w-52 h-1",
      tagline: "text-sm sm:text-base tracking-[0.5em]",
    },
  };

  const s = sizes[size];

  if (layout === "horizontal") {
    return (
      <div className={cn("flex items-baseline gap-2", className)}>
        <span className={cn("font-black leading-none tracking-tighter", s.overThe, textColor)}>
          Over The
        </span>
        <span className={cn("font-black leading-none tracking-tighter text-[#FDB81E]", s.top)}>
          Top
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("font-black leading-none tracking-tighter", s.overThe, textColor)}>
        Over The
      </div>
      <div className={cn("font-black leading-none tracking-tighter text-[#FDB81E] -mt-1", s.top)}>
        Top
      </div>
      <div className={cn("bg-[#FDB81E] opacity-50 mt-2", s.bar)} />
      {showTagline && (
        <div className={cn("font-semibold mt-3", s.tagline, taglineColor)}>
          THE RUMBLE APP
        </div>
      )}
    </div>
  );
}
