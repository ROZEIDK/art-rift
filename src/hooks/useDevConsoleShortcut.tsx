import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "./useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export const useDevConsoleShortcut = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const { isDeveloper, isAdmin } = useUserRole(currentUserId || undefined);
  const hasAccess = isDeveloper || isAdmin;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Alt+D (or Cmd+Alt+D on Mac)
      if ((event.ctrlKey || event.metaKey) && event.altKey && event.key === "d") {
        event.preventDefault();
        if (hasAccess) {
          navigate("/dev-console");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, hasAccess]);
};
