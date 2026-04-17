import { useEffect, useRef, useState } from "react";
import { Move, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageFocalPointPickerProps {
  imageUrl: string;
  /** CSS object-position string, e.g. "50% 30%" or "center center". */
  value: string;
  onChange: (next: string) => void;
}

function parsePosition(value: string): { x: number; y: number } {
  if (!value) return { x: 50, y: 50 };
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "center" || trimmed === "center center") return { x: 50, y: 50 };
  const parts = trimmed.split(/\s+/);
  const map: Record<string, number> = { left: 0, top: 0, center: 50, right: 100, bottom: 100 };
  const toNum = (token: string): number => {
    if (token in map) return map[token];
    const n = parseFloat(token);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50;
  };
  return { x: toNum(parts[0] || "50"), y: toNum(parts[1] || "50") };
}

function formatPosition(x: number, y: number): string {
  const fx = Math.round(x);
  const fy = Math.round(y);
  return `${fx}% ${fy}%`;
}

/**
 * Drag the dot on the image to set the focal point that should stay
 * visible when the image is rendered with `object-cover` (e.g. avatars).
 */
export function ImageFocalPointPicker({ imageUrl, value, onChange }: ImageFocalPointPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => parsePosition(value));
  const [dragging, setDragging] = useState(false);

  // Sync external value -> local
  useEffect(() => {
    setPos(parsePosition(value));
  }, [value]);

  const updateFromEvent = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const clamped = {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
    setPos(clamped);
    onChange(formatPosition(clamped.x, clamped.y));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging(true);
    updateFromEvent(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    updateFromEvent(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDragging(false);
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const reset = () => {
    setPos({ x: 50, y: 50 });
    onChange("center center");
  };

  const objectPosition = formatPosition(pos.x, pos.y);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Move className="w-3.5 h-3.5" />
          <span>Tap or drag to set focal point</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          className="h-7 px-2 text-xs"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Editor (aspect-square, full image visible) */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative aspect-square rounded-lg overflow-hidden bg-muted/20 border border-border touch-none cursor-crosshair select-none"
        >
          <img
            src={imageUrl}
            alt="Source"
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          {/* Focal dot */}
          <div
            className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white bg-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.4),0_2px_6px_rgba(0,0,0,0.5)] pointer-events-none"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            aria-hidden
          />
          <span className="absolute bottom-1 left-1 right-1 text-[10px] text-center text-muted-foreground bg-background/70 backdrop-blur rounded px-1 py-0.5">
            Source
          </span>
        </div>

        {/* Live preview matching how it renders elsewhere (avatar, object-cover) */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30 bg-muted/20">
            <img
              src={imageUrl}
              alt="Preview"
              draggable={false}
              className="w-full h-full object-cover"
              style={{ objectPosition }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">Avatar preview</span>
          <code className="text-[10px] text-muted-foreground">{objectPosition}</code>
        </div>
      </div>
    </div>
  );
}
