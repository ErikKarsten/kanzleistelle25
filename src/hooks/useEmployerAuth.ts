import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface EmployerAuthState {
  user: User | null;
  companyId: string | null;
  isLoading: boolean;
  isEmployer: boolean;
}

export const useEmployerAuth = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<EmployerAuthState>({
    user: null,
    companyId: null,
    isLoading: true,
    isEmployer: false,
  });

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setState({
            user: null,
            companyId: null,
            isLoading: false,
            isEmployer: false,
          });
          navigate("/login");
          return;
        }

        if (session?.user) {
          // Check if user is employer
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);

          const isEmployer = roles?.some((r) => r.role === "employer") || false;

          if (!isEmployer) {
            // Not an employer, redirect
            navigate("/");
            setState({
              user: session.user,
              companyId: null,
              isLoading: false,
              isEmployer: false,
            });
            return;
          }

          // Get company ID
          const { data: company } = await supabase
            .from("companies")
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();

          setState({
            user: session.user,
            companyId: company?.id || null,
            isLoading: false,
            isEmployer: true,
          });
        }
      }
    );

    // Then get initial session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setState({
          user: null,
          companyId: null,
          isLoading: false,
          isEmployer: false,
        });
        navigate("/login");
        return;
      }

      // Check employer role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isEmployer = roles?.some((r) => r.role === "employer") || false;

      if (!isEmployer) {
        navigate("/");
        setState({
          user: session.user,
          companyId: null,
          isLoading: false,
          isEmployer: false,
        });
        return;
      }

      // Get company
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setState({
        user: session.user,
        companyId: company?.id || null,
        isLoading: false,
        isEmployer: true,
      });
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...state, signOut };
};
