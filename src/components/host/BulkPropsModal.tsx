import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { CHAOS_PROPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BulkPropsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "mens" | "womens";
  onSubmit: (answers: Record<string, "YES" | "NO">) => Promise<void>;
}

export function BulkPropsModal({
  open,
  onOpenChange,
  type,
  onSubmit,
}: BulkPropsModalProps) {
  const [answers, setAnswers] = useState<Record<string, "YES" | "NO">>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allAnswered = Object.keys(answers).length === CHAOS_PROPS.length;

  const handleAnswer = (propId: string, answer: "YES" | "NO") => {
    setAnswers((prev) => ({ ...prev, [propId]: answer }));
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;

    setIsSubmitting(true);
    try {
      await onSubmit(answers);
      setAnswers({});
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAnswers({});
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Score {type === "mens" ? "Men's" : "Women's"} Rumble Props
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {CHAOS_PROPS.map((prop) => (
            <div
              key={prop.id}
              className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50"
            >
              <div className="flex-1">
                <span className="font-medium">{prop.shortName}</span>
                <p className="text-xs text-muted-foreground">{prop.question}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={answers[prop.id] === "YES" ? "gold" : "outline"}
                  size="sm"
                  className={cn(
                    "min-h-[44px] min-w-[50px]",
                    answers[prop.id] === "YES" && "ring-2 ring-primary"
                  )}
                  onClick={() => handleAnswer(prop.id, "YES")}
                >
                  YES
                </Button>
                <Button
                  variant={answers[prop.id] === "NO" ? "gold" : "outline"}
                  size="sm"
                  className={cn(
                    "min-h-[44px] min-w-[50px]",
                    answers[prop.id] === "NO" && "ring-2 ring-primary"
                  )}
                  onClick={() => handleAnswer(prop.id, "NO")}
                >
                  NO
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DrawerClose>
          <Button
            variant="gold"
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : `Submit All (${Object.keys(answers).length}/${CHAOS_PROPS.length})`}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
