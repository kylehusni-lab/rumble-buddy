import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RumbleEntrant {
  name: string;
  imageUrl: string | null;
  isConfirmed: boolean;
}

interface PlatformConfig {
  mensEntrants: string[];
  womensEntrants: string[];
  mensEntrantsData: RumbleEntrant[];
  womensEntrantsData: RumbleEntrant[];
}

export function usePlatformConfig() {
  const [config, setConfig] = useState<PlatformConfig>({
    mensEntrants: [],
    womensEntrants: [],
    mensEntrantsData: [],
    womensEntrantsData: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      // Fetch rumble participants from wrestlers table
      const { data: wrestlers, error } = await supabase
        .from("wrestlers")
        .select("name, image_url, division, is_confirmed")
        .eq("is_active", true)
        .eq("is_rumble_participant", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching wrestlers:", error);
        return;
      }

      if (wrestlers) {
        const mensData: RumbleEntrant[] = [];
        const womensData: RumbleEntrant[] = [];

        for (const w of wrestlers) {
          const entrant: RumbleEntrant = {
            name: w.name,
            imageUrl: w.image_url,
            isConfirmed: w.is_confirmed ?? true,
          };

          if (w.division === "mens") {
            mensData.push(entrant);
          } else {
            womensData.push(entrant);
          }
        }

        // Add Surprise/Other Entrant option at the end
        mensData.push({ name: "Surprise/Other Entrant", imageUrl: null, isConfirmed: true });
        womensData.push({ name: "Surprise/Other Entrant", imageUrl: null, isConfirmed: true });

        // Build string arrays (no prefix - use data objects for confirmation status)
        const mensEntrants = mensData.map(e => e.name);
        const womensEntrants = womensData.map(e => e.name);

        setConfig({
          mensEntrants,
          womensEntrants,
          mensEntrantsData: mensData,
          womensEntrantsData: womensData,
        });
      }
    } catch (err) {
      console.error("Error in usePlatformConfig:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();

    // Subscribe to realtime changes on wrestlers table
    const channel = supabase
      .channel("wrestlers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wrestlers",
        },
        () => {
          fetchConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConfig]);

  return { ...config, isLoading, refetch: fetchConfig };
}
