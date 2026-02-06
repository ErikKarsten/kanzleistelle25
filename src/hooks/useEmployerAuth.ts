import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface EmployerAuthState {
  user: ReturnType<typeof useAuth>["user"];
  companyId: string | null;
  isLoading: boolean;
  isEmployer: boolean;
  signOut: () => Promise<void>;
}

export const useEmployerAuth = (): EmployerAuthState => {
  const navigate = useNavigate();
  const { user, role, companyId, isLoading, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    // Admin trying to access employer dashboard - redirect to admin
    if (role === "admin") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    // Not an employer and no company - they shouldn't be here
    // But we'll let the dashboard handle the onboarding flow
  }, [isLoading, isAuthenticated, role, navigate]);

  return {
    user,
    companyId,
    isLoading,
    isEmployer: role === "employer" || !!companyId,
    signOut,
  };
};
