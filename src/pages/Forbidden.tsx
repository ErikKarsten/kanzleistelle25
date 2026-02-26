import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Forbidden = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const dashboardPath = role === "admin" ? "/admin/dashboard" : role === "employer" ? "/dashboard" : "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldAlert className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Halt!</h1>
        <p className="text-lg text-muted-foreground">
          Hier haben nur Admins Zutritt. Dieser Bereich ist für Ihren Account nicht zugänglich.
        </p>
        <Button onClick={() => navigate(dashboardPath)} size="lg" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Forbidden;
