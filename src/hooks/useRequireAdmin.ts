import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useRequireAdmin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          if (mounted) {
            navigate("/admin/login");
          }
          return;
        }

        // Check if user has admin role using the user_roles table
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          console.error("Error checking admin role:", error);
          if (mounted) {
            navigate("/admin/login");
          }
          return;
        }

        if (!roleData) {
          // User is authenticated but not an admin
          console.warn("User is not an admin");
          if (mounted) {
            setIsAuthorized(false);
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (mounted) {
          navigate("/admin/login");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          if (mounted) {
            navigate("/admin/login");
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { isLoading, isAuthorized };
};
