import { cn } from "@/lib/utils";
import { OttLogoImage } from "./OttLogoImage";

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
  const logoSize = {
    sm: "sm" as const,
    md: "md" as const,
    lg: "lg" as const,
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <OttLogoImage size={logoSize[size]} showTagline={showTagline} />
    </div>
  );
}
