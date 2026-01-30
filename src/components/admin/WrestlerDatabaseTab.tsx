import { useState, useEffect } from 'react';
import { Plus, Upload, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WrestlerCard } from '@/components/admin/WrestlerCard';
import { WrestlerFormModal } from '@/components/admin/WrestlerFormModal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { BulkImportModal } from '@/components/admin/BulkImportModal';
import { useWrestlerAdmin, Wrestler } from '@/hooks/useWrestlerAdmin';

export function WrestlerDatabaseTab() {
  // No PIN check needed - parent page already enforces admin role
  return <WrestlerDatabaseContent />;
}

function WrestlerDatabaseContent() {
  const {
    wrestlers,
    isLoading,
    searchQuery,
    setSearchQuery,
    divisionFilter,
    setDivisionFilter,
    mensParticipants,
    womensParticipants,
    createWrestler,
    updateWrestler,
    deleteWrestler,
    bulkImport,
    uploadImage,
    removeImage,
  } = useWrestlerAdmin(true);

  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search updates (150ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 150);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingWrestler, setEditingWrestler] = useState<Wrestler | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingWrestler, setDeletingWrestler] = useState<Wrestler | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (wrestler: Wrestler) => {
    setEditingWrestler(wrestler);
    setFormModalOpen(true);
  };

  const handleDelete = (wrestler: Wrestler) => {
    setDeletingWrestler(wrestler);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = async (data: Parameters<typeof createWrestler>[0]) => {
    setIsSubmitting(true);
    try {
      if (editingWrestler) {
        return await updateWrestler(editingWrestler.id, data);
      } else {
        return await createWrestler(data as Parameters<typeof createWrestler>[0]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWrestler) return;
    setIsDeleting(true);
    try {
      await deleteWrestler(deletingWrestler.id);
      setDeleteModalOpen(false);
      setDeletingWrestler(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormClose = (open: boolean) => {
    setFormModalOpen(open);
    if (!open) {
      setEditingWrestler(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search wrestlers..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={divisionFilter}
            onValueChange={(v) => setDivisionFilter(v as 'all' | 'mens' | 'womens')}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mens">
                Men's {mensParticipants > 0 && <span className="ml-1 text-xs opacity-70">({mensParticipants})</span>}
              </TabsTrigger>
              <TabsTrigger value="womens">
                Women's {womensParticipants > 0 && <span className="ml-1 text-xs opacity-70">({womensParticipants})</span>}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={() => setBulkModalOpen(true)}>
            <Upload className="w-4 h-4 mr-1" />
            Bulk
          </Button>
          <Button
            variant="hero"
            size="sm"
            onClick={() => {
              setEditingWrestler(null);
              setFormModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Count */}
      <div className="text-sm text-muted-foreground">
        {isLoading ? (
          <span className="animate-pulse">Loading...</span>
        ) : (
          <span>
            {wrestlers.length} wrestler{wrestlers.length !== 1 ? 's' : ''}
            {localSearch && ' found'}
          </span>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-card/30 border border-border rounded-xl aspect-[3/4] animate-pulse"
            />
          ))}
        </div>
      ) : wrestlers.length === 0 ? (
        <div className="text-center py-16">
          {localSearch ? (
            <>
              <p className="text-muted-foreground mb-4">
                No wrestlers match "{localSearch}"
              </p>
              <Button variant="outline" onClick={() => setLocalSearch('')}>
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">...</div>
              <p className="text-muted-foreground mb-4">No wrestlers in database</p>
              <p className="text-sm text-muted-foreground mb-6">
                Add your first wrestler to get started
              </p>
              <Button variant="hero" onClick={() => setFormModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Wrestler
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wrestlers.map((wrestler) => (
            <WrestlerCard
              key={wrestler.id}
              wrestler={wrestler}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <WrestlerFormModal
        open={formModalOpen}
        onOpenChange={handleFormClose}
        wrestler={editingWrestler}
        onSubmit={handleFormSubmit}
        onUploadImage={uploadImage}
        onRemoveImage={removeImage}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        wrestler={deletingWrestler}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      <BulkImportModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        onImport={bulkImport}
      />
    </div>
  );
}
