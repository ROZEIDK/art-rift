import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "user" | "developer" | "moderator" | "admin";

export const useUserRole = (userId?: string) => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log("useUserRole effect running with userId:", userId);
    
    if (!userId) {
      console.log("No userId, setting empty roles");
      setLoading(false);
      setRoles([]);
      setInitialized(true);
      return;
    }

    console.log("Setting loading to true, starting fetch for userId:", userId);
    setLoading(true);
    setInitialized(false);
    
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (error) throw error;
        
        const fetchedRoles = (data || []).map((r) => r.role as UserRole);
        console.log("Fetched roles for user", userId, ":", fetchedRoles);
        setRoles(fetchedRoles);
      } catch (error) {
        console.error("Error fetching roles:", error);
        setRoles([]);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    fetchRoles();
  }, [userId]);

  const hasRole = (role: UserRole) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isDeveloper = hasRole("developer");
  const isModerator = hasRole("moderator");

  const finalLoading = loading || !initialized;
  console.log("useUserRole returning:", { userId, roles, isDeveloper, isAdmin, loading, initialized, finalLoading });

  return { roles, hasRole, isAdmin, isDeveloper, isModerator, loading: finalLoading };
};
