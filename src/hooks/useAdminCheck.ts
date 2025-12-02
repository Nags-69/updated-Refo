import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAdminCheck = (userId: string | undefined) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    console.log("[useAdminCheck] Hook running. User:", user?.email, "UserId:", userId);

    const checkAdminRole = async () => {
      // 1. Hardcoded admin access (Temporary fix)
      if (user?.email === "mrnaveen0000@gmail.com") {
        console.log("[useAdminCheck] HARDCODED MATCH for mrnaveen0000@gmail.com. Granting admin access.");
        if (mounted) {
          setIsAdmin(true);
          setLoading(false);
        }
        return;
      }

      // 2. If no userId, we can't check DB, but don't fail if user is just loading
      if (!userId) {
        console.log("[useAdminCheck] No userId provided yet. Waiting...");
        // Do NOT set isAdmin to false here if we are still potentially loading auth
        // Only set false if we are sure there is no user
        if (!user && mounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        console.log(`[useAdminCheck] Checking database for admin role for userId: ${userId}`);
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();

        if (mounted) {
          console.log("[useAdminCheck] DB check result:", { data, error });
          if (data) {
            console.log("[useAdminCheck] Admin role found in DB.");
            setIsAdmin(true);
          } else {
            console.log("[useAdminCheck] No admin role found in DB.");
            setIsAdmin(false);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("[useAdminCheck] Error checking admin role:", error);
        if (mounted) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    checkAdminRole();

    return () => {
      mounted = false;
    };
  }, [userId, user]);

  return { isAdmin, loading };
};
