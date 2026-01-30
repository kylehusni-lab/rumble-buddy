import { cn } from "@/lib/utils";
import { RingIcon } from "./RingIcon";
import { TypographyLockup } from "./TypographyLockup";

interface LogoCombinedProps {
  layout?: "horizontal" | "stacked";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

export function LogoCombined({
  layout = "stacked",
  size = "md",
  showTagline = true,
  className,
}: LogoCombinedProps) {
  const iconSizes = {
    sm: 48,
    md: 80,
    lg: 120,
  };

  if (layout === "horizontal") {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <RingIcon size={iconSizes[size]} />
        <TypographyLockup
          layout="stacked"
          size={size}
          showTagline={showTagline}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <RingIcon size={iconSizes[size]} />
      <TypographyLockup
        layout="stacked"
        size={size}
        showTagline={showTagline}
      />
    </div>
  );
}
