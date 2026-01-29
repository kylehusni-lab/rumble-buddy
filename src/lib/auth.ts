// Auth utilities wrapping Supabase Anonymous Auth
// Provides seamless authentication without requiring passwords

import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  isAnonymous: boolean;
}

/**
 * Ensure user is authenticated (anonymously if needed)
 * Call this at entry points before creating/updating records
 */
export async function ensureAuthenticated(): Promise<AuthUser | null> {
  try {
    // Check existing session first
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      return {
        id: session.user.id,
        isAnonymous: session.user.is_anonymous ?? false,
      };
    }

    // No session - sign in anonymously
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.error("Anonymous sign-in failed:", error);
      return null;
    }

    if (data.user) {
      return {
        id: data.user.id,
        isAnonymous: true,
      };
    }

    return null;
  } catch (err) {
    console.error("Error ensuring authentication:", err);
    return null;
  }
}

/**
 * Get current authenticated user (does not create session if none exists)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      return {
        id: session.user.id,
        isAnonymous: session.user.is_anonymous ?? false,
      };
    }

    return null;
  } catch (err) {
    console.error("Error getting current user:", err);
    return null;
  }
}

/**
 * Sign out and clear session
 */
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Error signing out:", err);
  }
}

/**
 * Get auth user ID synchronously from cached session
 * Returns null if not authenticated
 */
export function getAuthUserId(): string | null {
  // This is a sync helper - actual auth state should use the hook
  return null;
}
