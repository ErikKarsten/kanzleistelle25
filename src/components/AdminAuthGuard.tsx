import { ReactNode } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { Loader2, ShieldX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AdminAuthGuardProps {
  children: ReactNode;
}

const AdminAuthGuard = ({ children }: AdminAuthGuardProps) => {
  const { isLoading, isAuthorized } = useRequireAdmin();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Authentifizierung wird überprüft...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <ShieldX className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>Zugriff verweigert</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Sie haben keine Berechtigung, auf diesen Bereich zuzugreifen.
              Bitte melden Sie sich mit einem Admin-Konto an.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Zur Startseite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminAuthGuard;
