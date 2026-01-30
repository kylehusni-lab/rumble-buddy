import { memo } from 'react';
import { Pencil, Trash2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getWrestlerImageUrl } from '@/lib/wrestler-data';
import type { Wrestler } from '@/hooks/useWrestlerAdmin';

interface WrestlerCardProps {
  wrestler: Wrestler;
  onEdit: (wrestler: Wrestler) => void;
  onDelete: (wrestler: Wrestler) => void;
}

export const WrestlerCard = memo(function WrestlerCard({ wrestler, onEdit, onDelete }: WrestlerCardProps) {
  const imageUrl = getWrestlerImageUrl(wrestler.name, wrestler.image_url);

  return (
    <div className="bg-card/50 border border-border rounded-xl overflow-hidden relative">
      {/* Rumble Participant Badge */}
      {wrestler.is_rumble_participant && (
        <div className="absolute top-2 right-2 z-10">
          <Badge 
            variant={wrestler.is_confirmed ? "default" : "outline"}
            className={wrestler.is_confirmed 
              ? "bg-primary text-primary-foreground" 
              : "border-dashed border-muted-foreground/50 text-muted-foreground"
            }
          >
            <Crown className="w-3 h-3 mr-1" />
            {wrestler.is_confirmed ? "In Rumble" : "Unconfirmed"}
          </Badge>
        </div>
      )}

      {/* Image Area */}
      <div className="relative aspect-square bg-muted/20 flex items-center justify-center">
        <img
          src={imageUrl}
          alt={wrestler.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
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
});
