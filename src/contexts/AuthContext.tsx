import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check if we are waiting for a Google/MagicLink redirect
    // This prevents the app from kicking you out while it processes the token
    const isHandlingRedirect =
      window.location.hash.includes('access_token') ||
      window.location.search.includes('code');

    // 2. Listen for auth changes (Sign In, Sign Out, Auto-Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        // Always stop loading when a state change happens (login success/fail)
        setIsLoading(false);
      }
    );

    // 3. Initial Session Check
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error("[AuthContext] Error getting session:", error);
        // If there's an error (like invalid refresh token), we should clear the session
        // and let the user sign in again.
        setIsLoading(false);
        return;
      }

      if (currentSession) {
        // If we have a saved session, restore it immediately
        setSession(currentSession);
        setUser(currentSession.user);
        setIsLoading(false);
      } else if (!isHandlingRedirect) {
        // ONLY stop loading if we are NOT waiting for a redirect.
        // If we ARE waiting for a redirect (isHandlingRedirect = true), 
        // we stay in "Loading..." state until onAuthStateChange fires above.
        setIsLoading(false);
      }
    }).catch((err) => {
      console.error("[AuthContext] Unexpected error during session check:", err);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};