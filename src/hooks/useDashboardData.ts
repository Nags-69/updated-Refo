import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useWallet = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["wallet", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase
                .from("wallet")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });
};

export const useTasks = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["tasks", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("tasks")
                .select("*, offers(*)")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });
};

export const useOffers = () => {
    return useQuery({
        queryKey: ["offers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("offers")
                .select("*")
                .eq("is_public", true)
                .eq("status", "active")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
};

export const useAffiliateLink = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["affiliate", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase
                .from("affiliate_links")
                .select("unique_code")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;
            return data ? `${window.location.origin}/?partner=${data.unique_code}` : "";
        },
        enabled: !!user,
        staleTime: Infinity, // Affiliate link doesn't change
    });
};
