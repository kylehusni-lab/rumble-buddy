import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_MENS_ENTRANTS, DEFAULT_WOMENS_ENTRANTS } from "@/lib/constants";

interface PlatformConfig {
  mensEntrants: string[];
  womensEntrants: string[];
}

export function usePlatformConfig() {
  const [config, setConfig] = useState<PlatformConfig>({
    mensEntrants: DEFAULT_MENS_ENTRANTS,
    womensEntrants: DEFAULT_WOMENS_ENTRANTS,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("platform_config")
        .select("key, value");

      if (error) {
        console.error("Error fetching platform config:", error);
        return;
      }

      if (data) {
        const newConfig: PlatformConfig = {
          mensEntrants: DEFAULT_MENS_ENTRANTS,
          womensEntrants: DEFAULT_WOMENS_ENTRANTS,
        };

        for (const row of data) {
          if (row.key === "mens_rumble_entrants" && Array.isArray(row.value)) {
            newConfig.mensEntrants = row.value as string[];
          } else if (row.key === "womens_rumble_entrants" && Array.isArray(row.value)) {
            newConfig.womensEntrants = row.value as string[];
          }
        }

        setConfig(newConfig);
      }
    } catch (err) {
      console.error("Error in usePlatformConfig:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("platform-config-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "platform_config",
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
