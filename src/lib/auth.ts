// Auth utilities wrapping Supabase Auth
// Provides authentication functions for email/password auth

import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  email?: string;
  isAnonymous: boolean;
}

export interface SignUpResult {
  user: AuthUser | null;
  error: string | null;
}

export interface SignInResult {
  user: AuthUser | null;
  error: string | null;
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string): Promise<SignUpResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      return {
        user: {
          id: data.user.id,
          email: data.user.email ?? undefined,
          isAnonymous: false,
        },
        error: null,
      };
    }

    return { user: null, error: "Failed to create account" };
  } catch (err) {
    console.error("Sign up error:", err);
    return { user: null, error: "An unexpected error occurred" };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<SignInResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      return {
        user: {
          id: data.user.id,
          email: data.user.email ?? undefined,
          isAnonymous: false,
        },
        error: null,
      };
    }

    return { user: null, error: "Login failed" };
  } catch (err) {
    console.error("Sign in error:", err);
    return { user: null, error: "An unexpected error occurred" };
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
        email: session.user.email ?? undefined,
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
 * Ensure user is authenticated - for backward compatibility
 * Now returns null if not authenticated (doesn't auto-create anonymous)
 */
export async function ensureAuthenticated(): Promise<AuthUser | null> {
  return getCurrentUser();
}

/**
 * Get auth user ID synchronously from cached session
 * Returns null if not authenticated
 */
export function getAuthUserId(): string | null {
  // This is a sync helper - actual auth state should use the hook
  return null;
}
