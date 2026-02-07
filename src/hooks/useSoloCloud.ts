// Solo mode cloud sync hook with unified email/password authentication
// Uses Supabase Auth (same as party mode) for authentication

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { setSoloSession, clearSoloSession, saveSoloPicks, saveSoloResults } from "@/lib/solo-storage";
import { getActiveEventId } from "@/lib/events";

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
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<SoloCloudState>({
    isLoading: true,
    isAuthenticated: false,
    player: null,
    error: null,
  });
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load solo player for authenticated user
  const loadPlayer = useCallback(async () => {
    if (!user) {
      setState({ isLoading: false, isAuthenticated: false, player: null, error: null });
      return;
    }

    try {
      // Query solo_players by user_id
      const { data, error } = await supabase
        .from("solo_players")
        .select("id, display_name, created_at")
        .eq("user_id", user.id)
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
        await syncPicksFromCloud(data.id);
        await syncResultsFromCloud(data.id);
      } else {
        // User is authenticated but no solo player record yet
        // This is valid - they just haven't set up solo mode
        setState({
          isLoading: false,
          isAuthenticated: false,
          player: null,
          error: null,
        });
      }
    } catch (err) {
      console.error("Error loading solo player:", err);
      setState({ isLoading: false, isAuthenticated: false, player: null, error: "Failed to load session" });
    }
  }, [user]);

  // Logout (just clears local state, auth handled by useAuth)
  const logout = () => {
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

  // Sync picks from cloud to local (filtered by current event)
  const syncPicksFromCloud = async (playerId: string) => {
    try {
      const { data, error } = await supabase
        .from("solo_picks")
        .select("match_id, prediction")
        .eq("solo_player_id", playerId)
        .eq("event_id", getActiveEventId());

      if (error) throw error;

      if (data && data.length > 0) {
        const picks: Record<string, string> = {};
        data.forEach((pick) => {
          picks[pick.match_id] = pick.prediction;
        });
        saveSoloPicks(picks);
      }
    } catch (err) {
      console.error("Error syncing picks from cloud:", err);
    }
  };

  // Sync results from cloud to local (filtered by current event)
  const syncResultsFromCloud = async (playerId: string) => {
    try {
      const { data, error } = await supabase
        .from("solo_results")
        .select("match_id, result")
        .eq("solo_player_id", playerId);

      if (error) throw error;

      if (data && data.length > 0) {
        const results: Record<string, string> = {};
        data.forEach((r) => {
          results[r.match_id] = r.result;
        });
        saveSoloResults(results);
      }
    } catch (err) {
      console.error("Error syncing results from cloud:", err);
    }
  };

  // Save picks to cloud using secure RPC function
  const savePicksToCloud = async (picks: Record<string, string>) => {
    if (!state.player?.id) return;

    try {
      const eventId = getActiveEventId();
      // Use secure RPC function for each pick (validates ownership and prevents post-scoring changes)
      const results = await Promise.all(
        Object.entries(picks).map(async ([match_id, prediction]) => {
          const { data, error } = await supabase.rpc("save_solo_pick", {
            p_player_id: state.player!.id,
            p_match_id: match_id,
            p_prediction: prediction,
            p_event_id: eventId,
          });
          
          if (error) throw error;
          return data;
        })
      );
      
      // Check for any failures
      const failures = results.flat().filter(r => r && !r.success);
      if (failures.length > 0) {
        console.warn("Some picks could not be saved:", failures.map(f => f.error_message));
      }
    } catch (err) {
      console.error("Error saving picks to cloud:", err);
    }
  };

  // Save results to cloud
  const saveResultsToCloud = async (results: Record<string, string>) => {
    if (!state.player?.id) return;

    try {
      const records = Object.entries(results).map(([match_id, result]) => ({
        solo_player_id: state.player!.id,
        match_id,
        result,
      }));

      const { error } = await supabase
        .from("solo_results")
        .upsert(records, { onConflict: "solo_player_id,match_id" });

      if (error) throw error;
    } catch (err) {
      console.error("Error saving results to cloud:", err);
    }
  };

  // Load player when auth state changes
  useEffect(() => {
    if (!authLoading) {
      loadPlayer();
    }
  }, [authLoading, user, loadPlayer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Subscribe to realtime changes when authenticated
  useEffect(() => {
    if (!state.player?.id) return;

    const channel = supabase
      .channel(`solo-picks-${state.player.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "solo_picks",
          filter: `solo_player_id=eq.${state.player.id}`,
        },
        () => {
          // Reload picks when changes detected
          syncPicksFromCloud(state.player!.id);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "solo_results",
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
    logout,
    savePicksToCloud,
    saveResultsToCloud,
    syncPicksFromCloud: () => state.player?.id ? syncPicksFromCloud(state.player.id) : Promise.resolve(),
    syncResultsFromCloud: () => state.player?.id ? syncResultsFromCloud(state.player.id) : Promise.resolve(),
  };
}
