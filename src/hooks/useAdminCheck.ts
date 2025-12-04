import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAdminCheck = (userId: string | undefined) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;


    const checkAdminRole = async () => {
      // 1. Hardcoded admin access (Temporary fix)
      if (user?.email === "mrnaveen0000@gmail.com") {

        if (mounted) {
          setIsAdmin(true);
          setLoading(false);
        }
        return;
      }

      // 2. If no userId, we can't check DB, but don't fail if user is just loading
      if (!userId) {

        // Do NOT set isAdmin to false here if we are still potentially loading auth
        // Only set false if we are sure there is no user
        if (!user && mounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();

        if (mounted) {

          if (data) {

            setIsAdmin(true);
          } else {

            setIsAdmin(false);
          }
          setLoading(false);
        }
      } catch (error) {

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
