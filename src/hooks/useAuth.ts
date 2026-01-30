// React hook for Supabase auth state management
// Provides real-time auth state updates with email/password auth support

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  signUp as authSignUp, 
  signIn as authSignIn, 
  type AuthUser, 
  type SignUpResult, 
  type SignInResult 
} from "@/lib/auth";

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
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
            email: session.user.email ?? undefined,
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
          email: session.user.email ?? undefined,
          isAnonymous: session.user.is_anonymous ?? false,
        });
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<SignUpResult> => {
    const result = await authSignUp(email, password);
    if (result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    const result = await authSignIn(email, password);
    if (result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
  };
}
