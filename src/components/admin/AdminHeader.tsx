import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Ship, Home } from "lucide-react";
import { toast } from "sonner";

const AdminHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error("Fehler beim Abmelden");
      return;
    }

    toast.success("Erfolgreich abgemeldet");
    navigate("/admin/login");
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container max-w-7xl flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors" title="Zur Startseite">
            <Home className="h-5 w-5 text-primary" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Ship className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Kanzleistelle24</span>
              <span className="text-muted-foreground ml-2 text-sm">Admin</span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Abmelden
        </Button>
      </div>
    </header>
  );
};

export default AdminHeader;
