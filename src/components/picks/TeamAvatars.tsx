import { cn } from "@/lib/utils";
import {
  getWrestlerImageUrl,
  getPlaceholderImageUrl,
  splitTeamMembers,
} from "@/lib/wrestler-data";

interface TeamAvatarsProps {
  /** Raw option string e.g. "Cody Rhodes & Jey Uso" or a single name */
  name: string;
  /** Pixel size of each circle */
  sizePx?: number;
  /** Tailwind border classes (e.g. "border-4 border-primary") */
  borderClassName?: string;
  /** Wrapper className */
  className?: string;
}

/**
 * Renders one or more overlapping circular avatars for a tag-team option.
 * Falls back to a single avatar for non-tag matches.
 */
export function TeamAvatars({
  name,
  sizePx = 80,
  borderClassName = "border-2 border-primary/30",
  className,
}: TeamAvatarsProps) {
  const members = splitTeamMembers(name);
  if (members.length <= 1) {
    return (
      <div
        className={cn("relative rounded-full overflow-hidden", borderClassName, className)}
        style={{ width: sizePx, height: sizePx }}
      >
        <img
          src={getWrestlerImageUrl(name)}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = getPlaceholderImageUrl(name);
          }}
        />
      </div>
    );
  }

  // Overlap by ~35% of the size
  const overlap = Math.round(sizePx * 0.35);
  return (
    <div
      className={cn("flex items-center", className)}
      style={{ paddingRight: 0 }}
    >
      {members.map((m, i) => (
        <div
          key={`${m}-${i}`}
          className={cn(
            "relative rounded-full overflow-hidden bg-muted shrink-0",
            borderClassName
          )}
          style={{
            width: sizePx,
            height: sizePx,
            marginLeft: i === 0 ? 0 : -overlap,
            zIndex: members.length - i,
          }}
        >
          <img
            src={getWrestlerImageUrl(m)}
            alt={m}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = getPlaceholderImageUrl(m);
            }}
          />
        </div>
      ))}
    </div>
  );
}
