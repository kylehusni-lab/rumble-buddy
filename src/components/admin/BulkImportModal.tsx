import { useState, forwardRef } from 'react';
import { Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (names: string[], division: 'mens' | 'womens') => Promise<{ imported: number; skipped: number }>;
}

export const BulkImportModal = forwardRef<HTMLDivElement, BulkImportModalProps>(function BulkImportModal({ open, onOpenChange, onImport }, ref) {
  const [namesText, setNamesText] = useState('');
  const [division, setDivision] = useState<'mens' | 'womens'>('mens');
  const [isImporting, setIsImporting] = useState(false);

  const parseNames = (text: string): string[] => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  const names = parseNames(namesText);

  const handleImport = async () => {
    if (names.length === 0) return;

    setIsImporting(true);
    try {
      await onImport(names, division);
      setNamesText('');
      onOpenChange(false);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!isImporting) {
      if (!newOpen) {
        setNamesText('');
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Import Wrestlers</DialogTitle>
          <DialogDescription>
            Add multiple wrestlers at once by pasting their names below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Names Textarea */}
          <div className="space-y-2">
            <Label htmlFor="names">Wrestler names (one per line)</Label>
            <Textarea
              id="names"
              placeholder={"Roman Reigns\nSeth Rollins\nCody Rhodes\nCM Punk"}
              value={namesText}
              onChange={(e) => setNamesText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* Division Select */}
          <div className="space-y-2">
            <Label htmlFor="bulk-division">Division for all</Label>
            <Select value={division} onValueChange={(v) => setDivision(v as 'mens' | 'womens')}>
              <SelectTrigger id="bulk-division">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mens">Men's Division</SelectItem>
                <SelectItem value="womens">Women's Division</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info */}
          <p className="text-xs text-muted-foreground">
            ⚠️ Images can be added individually after import. Duplicate names will be skipped.
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleClose(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleImport}
              disabled={names.length === 0 || isImporting}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting
                ? 'Importing...'
                : `Import ${names.length} Name${names.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
