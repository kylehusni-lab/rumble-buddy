import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Upload, Search, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WrestlerCard } from '@/components/admin/WrestlerCard';
import { WrestlerFormModal } from '@/components/admin/WrestlerFormModal';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { BulkImportModal } from '@/components/admin/BulkImportModal';
import { useWrestlerAdmin, Wrestler } from '@/hooks/useWrestlerAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function WrestlerDatabaseTab() {
  const navigate = useNavigate();
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pin, setPin] = useState('');

  // Verify admin session on mount
  useEffect(() => {
    const session = localStorage.getItem('platform_admin_session');
    const expiresAt = localStorage.getItem('platform_admin_expires');

    if (session && expiresAt && new Date(expiresAt) > new Date()) {
      setIsSessionValid(true);
    }
  }, []);

  const handleVerifyPin = async () => {
    if (!pin.trim()) return;
    
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-pin', {
        body: { pin: pin.trim() }
      });

      if (error) throw error;
      if (!data?.success) throw new Error('Invalid PIN');

      // Set session
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      localStorage.setItem('platform_admin_session', 'active');
      localStorage.setItem('platform_admin_expires', expiresAt.toISOString());
      
      setIsSessionValid(true);
      toast.success('Access granted');
    } catch (err) {
      toast.error('Invalid PIN');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isSessionValid) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Platform Admin PIN Required</h3>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
          Enter your Platform Admin PIN to access the Wrestler Database
        </p>
        <div className="flex gap-2 w-full max-w-xs">
          <Input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
            className="flex-1"
          />
          <Button onClick={handleVerifyPin} disabled={isVerifying || !pin.trim()}>
            {isVerifying ? 'Verifying...' : 'Unlock'}
          </Button>
        </div>
      </div>
    );
  }

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
