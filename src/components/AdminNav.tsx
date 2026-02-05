 import { useNavigate, useLocation } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Upload, Users, ArrowLeft, LayoutDashboard } from "lucide-react";
 
 const AdminNav = () => {
   const navigate = useNavigate();
   const location = useLocation();
 
   return (
     <div className="flex flex-wrap items-center gap-2 mb-6">
       <Button
         variant="ghost"
         onClick={() => navigate("/")}
         size="sm"
       >
         <ArrowLeft className="h-4 w-4" />
         Startseite
       </Button>
       
       <div className="h-6 w-px bg-border mx-2 hidden sm:block" />
       
       <Button
         variant={location.pathname === "/admin-dashboard" ? "default" : "outline"}
         onClick={() => navigate("/admin-dashboard")}
         size="sm"
       >
         <LayoutDashboard className="h-4 w-4" />
         Dashboard
       </Button>
       
       <Button
         variant={location.pathname === "/admin-upload" ? "default" : "outline"}
         onClick={() => navigate("/admin-upload")}
         size="sm"
       >
         <Upload className="h-4 w-4" />
         Jobs erstellen
       </Button>
       
       <Button
         variant={location.pathname === "/admin-applications" ? "default" : "outline"}
         onClick={() => navigate("/admin-applications")}
         size="sm"
       >
         <Users className="h-4 w-4" />
         Bewerbungen
       </Button>
     </div>
   );
 };
 
 export default AdminNav;