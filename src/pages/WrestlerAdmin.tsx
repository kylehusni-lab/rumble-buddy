import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Upload, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WrestlerCard } from '@/components/admin/WrestlerCard';
import { WrestlerFormModal } from '@/components/admin/WrestlerFormModal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { BulkImportModal } from '@/components/admin/BulkImportModal';
import { useWrestlerAdmin, Wrestler } from '@/hooks/useWrestlerAdmin';

export default function WrestlerAdmin() {
  const navigate = useNavigate();
  const {
    wrestlers,
    isLoading,
    searchQuery,
    setSearchQuery,
    divisionFilter,
    setDivisionFilter,
    createWrestler,
    updateWrestler,
    deleteWrestler,
    bulkImport,
    uploadImage,
    removeImage,
  } = useWrestlerAdmin();

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingWrestler, setEditingWrestler] = useState<Wrestler | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingWrestler, setDeletingWrestler] = useState<Wrestler | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verify admin session on mount
  useEffect(() => {
    const session = localStorage.getItem('platform_admin_session');
    const expiresAt = localStorage.getItem('platform_admin_expires');

    if (!session || !expiresAt || new Date(expiresAt) < new Date()) {
      localStorage.removeItem('platform_admin_session');
      localStorage.removeItem('platform_admin_expires');
      navigate('/platform-admin/verify');
    }
  }, [navigate]);

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/platform-admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">Wrestler Database</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
      </header>

      {/* Search & Filter */}
      <div className="sticky top-[57px] z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-3 max-w-6xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search wrestlers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs
            value={divisionFilter}
            onValueChange={(v) => setDivisionFilter(v as 'all' | 'mens' | 'womens')}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mens">Men's</TabsTrigger>
              <TabsTrigger value="womens">Women's</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
        {/* Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {isLoading ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            <span>
              {wrestlers.length} wrestler{wrestlers.length !== 1 ? 's' : ''}
              {searchQuery && ' found'}
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            {searchQuery ? (
              <>
                <p className="text-muted-foreground mb-4">
                  No wrestlers match "{searchQuery}"
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">📋</div>
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
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {wrestlers.map((wrestler) => (
              <WrestlerCard
                key={wrestler.id}
                wrestler={wrestler}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        )}
      </main>

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
