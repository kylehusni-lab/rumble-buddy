// Solo mode cloud sync hook with email + PIN authentication
// Now integrates with Supabase Anonymous Auth for proper user identity

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureAuthenticated } from "@/lib/auth";
import { getSoloSession, setSoloSession, clearSoloSession, saveSoloPicks, saveSoloResults } from "@/lib/solo-storage";

const SOLO_PLAYER_ID_KEY = 'rumble_solo_player_id';

export interface SoloPlayer {
  id: string;
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

  // Load player from stored ID using the public view
  const loadPlayer = useCallback(async () => {
    const playerId = getStoredPlayerId();
    if (!playerId) {
      setState({ isLoading: false, isAuthenticated: false, player: null, error: null });
      return;
    }

    try {
      // Use the public view that doesn't expose PIN or email
      const { data, error } = await supabase
        .from('solo_players_public')
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

  // Register new player using secure RPC + anonymous auth
  const register = async (email: string, pin: string, displayName: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Ensure user is authenticated (anonymous if needed)
      const authUser = await ensureAuthenticated();
      if (!authUser) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Authentication failed. Please try again.' }));
        return false;
      }

      // Use secure RPC function for registration
      const { data, error } = await supabase
        .rpc('register_solo_player', {
          p_email: email,
          p_pin: pin,
          p_display_name: displayName,
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Registration failed. Please try again.' }));
        return false;
      }

      const result = data[0];

      if (!result.success) {
        setState(prev => ({ ...prev, isLoading: false, error: result.error_message || 'Registration failed.' }));
        return false;
      }

      // Update the solo_player with user_id
      await supabase
        .from('solo_players')
        .update({ user_id: authUser.id })
        .eq('id', result.id);

      setStoredPlayerId(result.id);
      setSoloSession({
        displayName: result.display_name,
        createdAt: result.created_at,
      });

      setState({
        isLoading: false,
        isAuthenticated: true,
        player: {
          id: result.id,
          display_name: result.display_name,
          created_at: result.created_at,
        },
        error: null,
      });

      return true;
    } catch (err) {
      console.error('Error registering solo player:', err);
      setState(prev => ({ ...prev, isLoading: false, error: 'Registration failed. Please try again.' }));
      return false;
    }
  };

  // Login with email + PIN using secure RPC + anonymous auth
  const login = async (email: string, pin: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Ensure user is authenticated (anonymous if needed)
      const authUser = await ensureAuthenticated();
      if (!authUser) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Authentication failed. Please try again.' }));
        return false;
      }

      // Use secure RPC function for login (never exposes PIN client-side)
      const { data, error } = await supabase
        .rpc('verify_solo_login', {
          p_email: email,
          p_pin: pin,
        });

      if (error) throw error;

      if (!data || data.length === 0 || !data[0].valid) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Invalid email or PIN' }));
        return false;
      }

      const result = data[0];

      if (!result.id) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Account not found' }));
        return false;
      }

      // Update the solo_player with user_id
      await supabase
        .from('solo_players')
        .update({ user_id: authUser.id })
        .eq('id', result.id);

      setStoredPlayerId(result.id);
      setSoloSession({
        displayName: result.display_name,
        createdAt: result.created_at,
      });

      // Load picks from cloud
      await syncPicksFromCloud(result.id);
      await syncResultsFromCloud(result.id);

      setState({
        isLoading: false,
        isAuthenticated: true,
        player: {
          id: result.id,
          display_name: result.display_name,
          created_at: result.created_at,
        },
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

  // Save picks to cloud using secure RPC function
  const savePicksToCloud = async (picks: Record<string, string>) => {
    const playerId = getStoredPlayerId();
    if (!playerId) return;

    try {
      // Use secure RPC function for each pick (validates ownership and prevents post-scoring changes)
      const results = await Promise.all(
        Object.entries(picks).map(async ([match_id, prediction]) => {
          const { data, error } = await supabase.rpc('save_solo_pick', {
            p_player_id: playerId,
            p_match_id: match_id,
            p_prediction: prediction,
          });
          
          if (error) throw error;
          return data;
        })
      );
      
      // Check for any failures
      const failures = results.flat().filter(r => r && !r.success);
      if (failures.length > 0) {
        console.warn('Some picks could not be saved:', failures.map(f => f.error_message));
      }
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
