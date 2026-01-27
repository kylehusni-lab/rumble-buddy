// Utilities for handling entrant names with unconfirmed status

/**
 * Check if an entrant is marked as unconfirmed (prefixed with *)
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
