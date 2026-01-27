import { useState } from "react";
import { User } from "lucide-react";
import { getWrestlerImageUrl, getPlaceholderImageUrl } from "@/lib/wrestler-data";
import { cn } from "@/lib/utils";

interface WrestlerImageProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallbackIcon?: boolean;
  eliminated?: boolean;
}

const sizeClasses = {
  sm: "w-12 h-12",   // 48px
  md: "w-20 h-20",   // 80px
  lg: "w-44 h-44",   // 176px
  xl: "w-[400px] h-[400px]", // 400px
};

export function WrestlerImage({ 
  name, 
  size = "md", 
  className,
  showFallbackIcon = false,
  eliminated = false,
}: WrestlerImageProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getWrestlerImageUrl(name);
  const fallbackUrl = getPlaceholderImageUrl(name);

  // If image fails or name is empty, show fallback
  if (imageError || !name) {
    if (showFallbackIcon) {
      return (
        <div 
          className={cn(
            sizeClasses[size],
            "rounded-full bg-gradient-to-br from-muted to-background flex items-center justify-center border-2 border-muted",
            eliminated && "grayscale opacity-50",
            className
          )}
        >
          <User className="w-1/2 h-1/2 text-muted-foreground" />
        </div>
      );
    }
    
    return (
      <img
        src={fallbackUrl}
        alt={name || "Wrestler"}
        className={cn(
          sizeClasses[size],
          "rounded-full object-cover border-2 border-primary/30",
          eliminated && "grayscale opacity-50",
          className
        )}
      />
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className={cn(
        sizeClasses[size],
        "rounded-full object-cover border-2 border-primary/30",
        eliminated && "grayscale opacity-50",
        className
      )}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
}
