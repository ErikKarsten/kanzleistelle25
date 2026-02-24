import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Briefcase, Home, Bell } from "lucide-react";
import ReactivationRequests, { useReactivationRequests } from "./ReactivationRequests";

const AdminHeader = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const { data: requests } = useReactivationRequests();
  const [requestsOpen, setRequestsOpen] = useState(false);

  const requestCount = requests?.length ?? 0;

  const handleLogout = async () => {
    await signOut();
    queryClient.clear();
    navigate("/");
  };

  return (
    <>
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors" title="Zur Startseite">
              <Home className="h-5 w-5 text-primary" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-foreground">Kanzleistelle24</span>
                <span className="text-muted-foreground ml-2 text-sm">Admin</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Reactivation requests bell */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRequestsOpen(true)}
              className="relative text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              {requestCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground border-2 border-background rounded-full">
                  {requestCount}
                </Badge>
              )}
            </Button>

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
        </div>
      </header>

      <ReactivationRequests open={requestsOpen} onOpenChange={setRequestsOpen} />
    </>
  );
};

export default AdminHeader;
