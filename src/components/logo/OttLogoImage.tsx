import { cn } from "@/lib/utils";
import ottLogo from "@/assets/ott-logo.png";

interface OttLogoImageProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
}

const sizes = {
  xs: { width: 48, height: 48 },
  sm: { width: 80, height: 80 },
  md: { width: 120, height: 120 },
  lg: { width: 180, height: 180 },
  xl: { width: 280, height: 280 },
};

export function OttLogoImage({
  size = "md",
  className,
  showTagline = false,
}: OttLogoImageProps) {
  const dimensions = sizes[size];

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <img
        src={ottLogo}
        alt="Over The Top"
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain"
        loading="eager"
        fetchPriority="high"
      />
      {showTagline && (
        <div className="text-xs sm:text-sm tracking-[0.3em] font-semibold text-muted-foreground mt-2 uppercase">
          The Rumble App
        </div>
      )}
    </div>
  );
}
