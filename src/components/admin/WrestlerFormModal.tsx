import { useState, useRef, useEffect } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPlaceholderImageUrl } from '@/lib/wrestler-data';
import type { Wrestler, CreateWrestlerData, UpdateWrestlerData } from '@/hooks/useWrestlerAdmin';

interface WrestlerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wrestler?: Wrestler | null;
  onSubmit: (data: CreateWrestlerData | UpdateWrestlerData) => Promise<Wrestler | null>;
  onUploadImage?: (file: File, wrestlerId: string) => Promise<string | null>;
  onRemoveImage?: (wrestlerId: string) => Promise<boolean>;
  isSubmitting?: boolean;
}

export function WrestlerFormModal({
  open,
  onOpenChange,
  wrestler,
  onSubmit,
  onUploadImage,
  onRemoveImage,
  isSubmitting = false,
}: WrestlerFormModalProps) {
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [division, setDivision] = useState<'mens' | 'womens'>('mens');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!wrestler;

  // Reset form when modal opens/closes or wrestler changes
  useEffect(() => {
    if (open) {
      if (wrestler) {
        setName(wrestler.name);
        setShortName(wrestler.short_name || '');
        setDivision(wrestler.division);
        setImagePreview(wrestler.image_url);
      } else {
        setName('');
        setShortName('');
        setDivision('mens');
        setImagePreview(null);
      }
      setPendingFile(null);
    }
  }, [open, wrestler]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setPendingFile(file);
  };

  const handleRemoveImage = async () => {
    if (wrestler && onRemoveImage) {
      const success = await onRemoveImage(wrestler.id);
      if (success) {
        setImagePreview(null);
        setPendingFile(null);
      }
    } else {
      setImagePreview(null);
      setPendingFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const data: CreateWrestlerData | UpdateWrestlerData = {
      name: name.trim(),
      short_name: shortName.trim() || undefined,
      division,
    };

    const result = await onSubmit(data);

    // If we have a pending file and the wrestler was created/updated, upload the image
    if (result && pendingFile && onUploadImage) {
      setIsUploading(true);
      await onUploadImage(pendingFile, result.id);
      setIsUploading(false);
    }

    if (result) {
      onOpenChange(false);
    }
  };

  const displayImage = imagePreview || (name ? getPlaceholderImageUrl(name) : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Wrestler' : 'Add New Wrestler'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-xl bg-muted/20 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Camera className="w-6 h-6" />
                    <span className="text-[10px]">Upload</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
              {(imagePreview || pendingFile) && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Wrestler Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Roman Reigns"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>

              {/* Division Field */}
              <div className="space-y-2">
                <Label htmlFor="division">Division *</Label>
                <Select value={division} onValueChange={(v) => setDivision(v as 'mens' | 'womens')}>
                  <SelectTrigger id="division">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mens">Men's Division</SelectItem>
                    <SelectItem value="womens">Women's Division</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Short Name Field */}
          <div className="space-y-2">
            <Label htmlFor="shortName">Short Name (optional)</Label>
            <Input
              id="shortName"
              placeholder="e.g., Roman"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground">
              Used for compact displays like leaderboards
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              disabled={!name.trim() || isSubmitting || isUploading}
            >
              {isUploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-pulse" />
                  Uploading...
                </>
              ) : isSubmitting ? (
                'Saving...'
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add Wrestler'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
