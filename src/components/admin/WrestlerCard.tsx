import { Pencil, Trash2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlaceholderImageUrl } from '@/lib/wrestler-data';
import type { Wrestler } from '@/hooks/useWrestlerAdmin';

interface WrestlerCardProps {
  wrestler: Wrestler;
  onEdit: (wrestler: Wrestler) => void;
  onDelete: (wrestler: Wrestler) => void;
}

export function WrestlerCard({ wrestler, onEdit, onDelete }: WrestlerCardProps) {
  const imageUrl = wrestler.image_url || getPlaceholderImageUrl(wrestler.name);
  const hasImage = !!wrestler.image_url;

  return (
    <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
      {/* Image Area */}
      <div className="relative aspect-square bg-muted/20 flex items-center justify-center">
        {hasImage ? (
          <img
            src={imageUrl}
            alt={wrestler.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = getPlaceholderImageUrl(wrestler.name);
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Camera className="w-8 h-8" />
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="p-3">
        <h3 className="font-semibold text-foreground truncate" title={wrestler.name}>
          {wrestler.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {wrestler.division === 'mens' ? "Men's" : "Women's"}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8"
            onClick={() => onEdit(wrestler)}
          >
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(wrestler)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
