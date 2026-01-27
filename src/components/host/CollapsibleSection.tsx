import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  scoredCount: number;
  totalCount: number;
  pointsAwarded: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  scoredCount,
  totalCount,
  pointsAwarded,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isComplete = scoredCount === totalCount && totalCount > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-2 hover:bg-muted/70 transition-colors">
        <div className="flex items-center gap-2">
          <ChevronDown
            size={18}
            className={cn(
              "transition-transform duration-200",
              open && "rotate-180"
            )}
          />
          <span className="font-semibold">{title}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={cn(
            "text-muted-foreground",
            isComplete && "text-success"
          )}>
            {scoredCount}/{totalCount}
          </span>
          {pointsAwarded > 0 && (
            <span className="text-success font-medium">
              +{pointsAwarded} pts
            </span>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
