import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "user" | "developer" | "moderator" | "admin";

export const useUserRole = (userId?: string) => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setRoles([]);
      return;
    }

    setLoading(true);
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (error) throw error;
        
        setRoles((data || []).map((r) => r.role as UserRole));
      } catch (error) {
        console.error("Error fetching roles:", error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [userId]);

  const hasRole = (role: UserRole) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isDeveloper = hasRole("developer");
  const isModerator = hasRole("moderator");

  return { roles, hasRole, isAdmin, isDeveloper, isModerator, loading };
};
