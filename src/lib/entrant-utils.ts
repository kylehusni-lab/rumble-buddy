// Utilities for handling entrant names with unconfirmed status

interface EntrantData {
  name: string;
  isConfirmed: boolean;
}

/**
 * Check if an entrant is unconfirmed using the entrant data array
 * This is the preferred method - use data-driven lookup
 */
export function isUnconfirmedByData(
  name: string,
  entrantsData: EntrantData[]
): boolean {
  const entrant = entrantsData.find(e => e.name === name);
  return entrant ? !entrant.isConfirmed : false;
}

/**
 * @deprecated Use isUnconfirmedByData instead
 * Legacy check for asterisk prefix (kept for backward compatibility)
 */
export function isUnconfirmedEntrant(name: string): boolean {
  return name.startsWith('*');
}

/**
 * Get the display name for an entrant (removes * prefix if present)
 */
export function getEntrantDisplayName(name: string): string {
  return name.startsWith('*') ? name.slice(1) : name;
}

/**
 * Get the raw name (for database storage/matching)
 */
export function getEntrantRawName(name: string): string {
  return name;
}

/**
 * Sort entrants alphabetically, ignoring the * prefix for unconfirmed entrants
 * Keeps "Surprise" entries at the end
 */
export function sortEntrants(a: string, b: string): number {
  // Keep "Surprise/Other Entrant" at the end
  if (a.includes("Surprise")) return 1;
  if (b.includes("Surprise")) return -1;
  
  // Compare by display name (strips * prefix)
  const nameA = getEntrantDisplayName(a);
  const nameB = getEntrantDisplayName(b);
  return nameA.localeCompare(nameB);
}
