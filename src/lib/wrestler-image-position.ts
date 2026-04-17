// Lightweight global cache for wrestler image_position values.
// Used by <WrestlerImage /> to apply a per-wrestler focal point so faces
// don't get cropped by `object-cover`.

import { supabase } from "@/integrations/supabase/client";

type PositionMap = Map<string, string>;

let cache: PositionMap | null = null;
let inflight: Promise<PositionMap> | null = null;
const subscribers = new Set<() => void>();

function normalizeName(name: string): string {
  if (!name) return "";
  return name.startsWith("*") ? name.slice(1).trim() : name.trim();
}

async function loadCache(): Promise<PositionMap> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    const { data, error } = await supabase
      .from("wrestlers")
      .select("name, image_position")
      .eq("is_active", true);

    const map: PositionMap = new Map();
    if (!error && data) {
      for (const row of data as Array<{ name: string; image_position: string | null }>) {
        if (row.image_position) {
          map.set(row.name.toLowerCase(), row.image_position);
        }
      }
    }
    cache = map;
    inflight = null;
    subscribers.forEach((fn) => fn());
    return map;
  })();

  return inflight;
}

export function getWrestlerImagePosition(name: string): string {
  const key = normalizeName(name).toLowerCase();
  if (!key) return "center center";
  if (!cache) {
    // kick off a background load; return default for now
    void loadCache();
    return "center center";
  }
  return cache.get(key) || "center center";
}

export function ensureWrestlerPositionsLoaded(): Promise<void> {
  return loadCache().then(() => undefined);
}

export function subscribeToWrestlerPositions(fn: () => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/** Update one wrestler's cached position (call after a successful admin save). */
export function setWrestlerImagePositionLocal(name: string, position: string) {
  if (!cache) cache = new Map();
  cache.set(normalizeName(name).toLowerCase(), position || "center center");
  subscribers.forEach((fn) => fn());
}
