import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "employer" | "candidate" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  companyId: string | null;
  companyName: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
      }

      // Determine primary role
      const isAdmin = roles?.some((r) => r.role === "admin") || false;
      const isEmployer = roles?.some((r) => r.role === "employer") || false;

      if (isAdmin) {
        setRole("admin");
      } else if (isEmployer) {
        setRole("employer");
      } else {
        setRole("candidate");
      }

      // Fetch company if employer
      if (isEmployer || !roles || roles.length === 0) {
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("id, name")
          .eq("user_id", userId)
          .maybeSingle();

        if (companyError) {
          console.error("Error fetching company:", companyError);
        }

        if (company) {
          setCompanyId(company.id);
          setCompanyName(company.name);
          // If user has a company but no employer role, they should still be treated as employer
          if (!isEmployer && !isAdmin) {
            setRole("employer");
          }
        } else {
          setCompanyId(null);
          setCompanyName(null);
        }
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
    }
  };

  const refreshAuth = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      setSession(currentSession);
      setUser(currentSession.user);
      await fetchUserData(currentSession.user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state change:", event, currentSession?.user?.email);

        if (event === "SIGNED_OUT") {
          setUser(null);
          setSession(null);
          setRole(null);
          setCompanyId(null);
          setIsLoading(false);
          return;
        }

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            await fetchUserData(currentSession.user.id);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setSession(null);
          setRole(null);
          setCompanyId(null);
          setIsLoading(false);
        }
      }
    );

    // Then get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchUserData(currentSession.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setCompanyId(null);
    setCompanyName(null);
  };

  const value: AuthContextType = {
    user,
    session,
    role,
    companyId,
    companyName,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
