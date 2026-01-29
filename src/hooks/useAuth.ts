// React hook for Supabase auth state management
// Provides real-time auth state updates with anonymous auth support

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureAuthenticated, type AuthUser } from "@/lib/auth";

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  ensureAuth: () => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener BEFORE checking initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            isAnonymous: session.user.is_anonymous ?? false,
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          isAnonymous: session.user.is_anonymous ?? false,
        });
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const ensureAuth = useCallback(async (): Promise<AuthUser | null> => {
    const authUser = await ensureAuthenticated();
    if (authUser) {
      setUser(authUser);
    }
    return authUser;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    ensureAuth,
    signOut,
  };
}
