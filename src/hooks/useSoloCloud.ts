// Solo mode cloud sync hook with email + PIN authentication

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSoloSession, setSoloSession, clearSoloSession, getSoloPicks, saveSoloPicks, getSoloResults, saveSoloResults } from "@/lib/solo-storage";

const SOLO_PLAYER_ID_KEY = 'rumble_solo_player_id';

export interface SoloPlayer {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface SoloCloudState {
  isLoading: boolean;
  isAuthenticated: boolean;
  player: SoloPlayer | null;
  error: string | null;
}

export function useSoloCloud() {
  const [state, setState] = useState<SoloCloudState>({
    isLoading: true,
    isAuthenticated: false,
    player: null,
    error: null,
  });
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Get stored player ID
  const getStoredPlayerId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(SOLO_PLAYER_ID_KEY);
  };

  const setStoredPlayerId = (id: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SOLO_PLAYER_ID_KEY, id);
  };

  const clearStoredPlayerId = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SOLO_PLAYER_ID_KEY);
  };

  // Load player from stored ID
  const loadPlayer = useCallback(async () => {
    const playerId = getStoredPlayerId();
    if (!playerId) {
      setState({ isLoading: false, isAuthenticated: false, player: null, error: null });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('solo_players')
        .select('*')
        .eq('id', playerId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setState({
          isLoading: false,
          isAuthenticated: true,
          player: data,
          error: null,
        });
        
        // Sync session
        setSoloSession({
          displayName: data.display_name,
          createdAt: data.created_at,
        });
        
        // Load picks from cloud
        await syncPicksFromCloud(playerId);
        await syncResultsFromCloud(playerId);
      } else {
        // Player not found, clear stored ID
        clearStoredPlayerId();
        setState({ isLoading: false, isAuthenticated: false, player: null, error: null });
      }
    } catch (err) {
      console.error('Error loading solo player:', err);
      setState({ isLoading: false, isAuthenticated: false, player: null, error: 'Failed to load session' });
    }
  }, []);

  // Register new player
  const register = async (email: string, pin: string, displayName: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if email already exists
      const { data: existing } = await supabase
        .from('solo_players')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (existing) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Email already registered. Try signing in instead.' }));
        return false;
      }

      // Create new player
      const { data, error } = await supabase
        .from('solo_players')
        .insert({
          email: email.toLowerCase().trim(),
          pin,
          display_name: displayName.trim() || 'Me',
        })
        .select()
        .single();

      if (error) throw error;

      setStoredPlayerId(data.id);
      setSoloSession({
        displayName: data.display_name,
        createdAt: data.created_at,
      });

      setState({
        isLoading: false,
        isAuthenticated: true,
        player: data,
        error: null,
      });

      return true;
    } catch (err) {
      console.error('Error registering solo player:', err);
      setState(prev => ({ ...prev, isLoading: false, error: 'Registration failed. Please try again.' }));
      return false;
    }
  };

  // Login with email + PIN
  const login = async (email: string, pin: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('solo_players')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('pin', pin)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Invalid email or PIN' }));
        return false;
      }

      setStoredPlayerId(data.id);
      setSoloSession({
        displayName: data.display_name,
        createdAt: data.created_at,
      });

      // Load picks from cloud
      await syncPicksFromCloud(data.id);
      await syncResultsFromCloud(data.id);

      setState({
        isLoading: false,
        isAuthenticated: true,
        player: data,
        error: null,
      });

      return true;
    } catch (err) {
      console.error('Error logging in solo player:', err);
      setState(prev => ({ ...prev, isLoading: false, error: 'Login failed. Please try again.' }));
      return false;
    }
  };

  // Logout
  const logout = () => {
    clearStoredPlayerId();
    clearSoloSession();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setState({
      isLoading: false,
      isAuthenticated: false,
      player: null,
      error: null,
    });
  };

  // Sync picks from cloud to local
  const syncPicksFromCloud = async (playerId: string) => {
    try {
      const { data, error } = await supabase
        .from('solo_picks')
        .select('match_id, prediction')
        .eq('solo_player_id', playerId);

      if (error) throw error;

      if (data && data.length > 0) {
        const picks: Record<string, string> = {};
        data.forEach((pick) => {
          picks[pick.match_id] = pick.prediction;
        });
        saveSoloPicks(picks);
      }
    } catch (err) {
      console.error('Error syncing picks from cloud:', err);
    }
  };

  // Sync results from cloud to local
  const syncResultsFromCloud = async (playerId: string) => {
    try {
      const { data, error } = await supabase
        .from('solo_results')
        .select('match_id, result')
        .eq('solo_player_id', playerId);

      if (error) throw error;

      if (data && data.length > 0) {
        const results: Record<string, string> = {};
        data.forEach((r) => {
          results[r.match_id] = r.result;
        });
        saveSoloResults(results);
      }
    } catch (err) {
      console.error('Error syncing results from cloud:', err);
    }
  };

  // Save picks to cloud
  const savePicksToCloud = async (picks: Record<string, string>) => {
    const playerId = getStoredPlayerId();
    if (!playerId) return;

    try {
      const records = Object.entries(picks).map(([match_id, prediction]) => ({
        solo_player_id: playerId,
        match_id,
        prediction,
      }));

      const { error } = await supabase
        .from('solo_picks')
        .upsert(records, { onConflict: 'solo_player_id,match_id' });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving picks to cloud:', err);
    }
  };

  // Save results to cloud
  const saveResultsToCloud = async (results: Record<string, string>) => {
    const playerId = getStoredPlayerId();
    if (!playerId) return;

    try {
      const records = Object.entries(results).map(([match_id, result]) => ({
        solo_player_id: playerId,
        match_id,
        result,
      }));

      const { error } = await supabase
        .from('solo_results')
        .upsert(records, { onConflict: 'solo_player_id,match_id' });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving results to cloud:', err);
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    loadPlayer();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [loadPlayer]);

  // Subscribe to realtime changes when authenticated
  useEffect(() => {
    if (!state.player?.id) return;

    const channel = supabase
      .channel(`solo-picks-${state.player.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solo_picks',
          filter: `solo_player_id=eq.${state.player.id}`,
        },
        () => {
          // Reload picks when changes detected
          syncPicksFromCloud(state.player!.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solo_results',
          filter: `solo_player_id=eq.${state.player.id}`,
        },
        () => {
          // Reload results when changes detected
          syncResultsFromCloud(state.player!.id);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.player?.id]);

  return {
    ...state,
    register,
    login,
    logout,
    savePicksToCloud,
    saveResultsToCloud,
    syncPicksFromCloud: () => state.player?.id ? syncPicksFromCloud(state.player.id) : Promise.resolve(),
    syncResultsFromCloud: () => state.player?.id ? syncResultsFromCloud(state.player.id) : Promise.resolve(),
  };
}
