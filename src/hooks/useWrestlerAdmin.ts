import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage, validateImageFile } from '@/lib/image-utils';
import { toast } from 'sonner';

export interface Wrestler {
  id: string;
  name: string;
  short_name: string | null;
  division: 'mens' | 'womens';
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWrestlerData {
  name: string;
  short_name?: string;
  division: 'mens' | 'womens';
  image_url?: string;
}

export interface UpdateWrestlerData {
  name?: string;
  short_name?: string;
  division?: 'mens' | 'womens';
  image_url?: string;
}

export function useWrestlerAdmin() {
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<'all' | 'mens' | 'womens'>('all');

  const getAdminToken = () => {
    return localStorage.getItem('platform_admin_session') || '';
  };

  const fetchWrestlers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-wrestlers', {
        body: {
          token: getAdminToken(),
          action: 'list',
          data: {
            search: searchQuery || undefined,
            division_filter: divisionFilter,
          },
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setWrestlers(data.wrestlers || []);
    } catch (error) {
      console.error('Error fetching wrestlers:', error);
      toast.error('Failed to load wrestlers');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, divisionFilter]);

  useEffect(() => {
    fetchWrestlers();
  }, [fetchWrestlers]);

  const createWrestler = async (wrestlerData: CreateWrestlerData): Promise<Wrestler | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-wrestlers', {
        body: {
          token: getAdminToken(),
          action: 'create',
          data: wrestlerData,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(`${wrestlerData.name} added to roster`);
      await fetchWrestlers();
      return data.wrestler;
    } catch (error) {
      console.error('Error creating wrestler:', error);
      const message = error instanceof Error ? error.message : 'Failed to add wrestler';
      toast.error(message);
      return null;
    }
  };

  const updateWrestler = async (id: string, updates: UpdateWrestlerData): Promise<Wrestler | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-wrestlers', {
        body: {
          token: getAdminToken(),
          action: 'update',
          data: { id, ...updates },
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Wrestler updated');
      await fetchWrestlers();
      return data.wrestler;
    } catch (error) {
      console.error('Error updating wrestler:', error);
      const message = error instanceof Error ? error.message : 'Failed to update wrestler';
      toast.error(message);
      return null;
    }
  };

  const deleteWrestler = async (id: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-wrestlers', {
        body: {
          token: getAdminToken(),
          action: 'delete',
          data: { id },
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Wrestler removed');
      await fetchWrestlers();
      return true;
    } catch (error) {
      console.error('Error deleting wrestler:', error);
      toast.error('Failed to remove wrestler');
      return false;
    }
  };

  const bulkImport = async (names: string[], division: 'mens' | 'womens'): Promise<{ imported: number; skipped: number }> => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-wrestlers', {
        body: {
          token: getAdminToken(),
          action: 'bulk_import',
          data: {
            names,
            default_division: division,
          },
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const result = { imported: data.imported || 0, skipped: data.skipped || 0 };
      
      if (result.imported > 0) {
        toast.success(`${result.imported} wrestlers imported${result.skipped > 0 ? `, ${result.skipped} skipped (duplicates)` : ''}`);
      } else if (result.skipped > 0) {
        toast.info(`All ${result.skipped} wrestlers already exist`);
      }
      
      await fetchWrestlers();
      return result;
    } catch (error) {
      console.error('Error bulk importing:', error);
      const message = error instanceof Error ? error.message : 'Failed to import wrestlers';
      toast.error(message);
      return { imported: 0, skipped: 0 };
    }
  };

  const uploadImage = async (file: File, wrestlerId: string): Promise<string | null> => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return null;
    }

    try {
      // Compress image
      const compressedBlob = await compressImage(file);
      
      // Upload to storage
      const fileName = `${wrestlerId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('wrestler-images')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('wrestler-images')
        .getPublicUrl(fileName);

      // Add cache buster to URL
      const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update wrestler record with new image URL
      await updateWrestler(wrestlerId, { image_url: imageUrl });

      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const removeImage = async (wrestlerId: string): Promise<boolean> => {
    try {
      // Delete from storage
      const fileName = `${wrestlerId}.jpg`;
      await supabase.storage.from('wrestler-images').remove([fileName]);

      // Update wrestler record to remove image URL
      await updateWrestler(wrestlerId, { image_url: '' });

      return true;
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
      return false;
    }
  };

  // Filter wrestlers client-side for instant search feedback
  const filteredWrestlers = wrestlers.filter((wrestler) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!wrestler.name.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (divisionFilter !== 'all' && wrestler.division !== divisionFilter) {
      return false;
    }
    return true;
  });

  return {
    wrestlers: filteredWrestlers,
    allWrestlers: wrestlers,
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
    refetch: fetchWrestlers,
  };
}
