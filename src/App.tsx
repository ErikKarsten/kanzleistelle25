import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminUpload from "./pages/AdminUpload";
import AdminApplications from "./pages/AdminApplications";
import AdminDashboardLegacy from "./pages/AdminDashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLogin from "./pages/admin/Login";
import Karrieretipps from "./pages/Karrieretipps";
import Loesungen from "./pages/Loesungen";
import FuerArbeitgeber from "./pages/FuerArbeitgeber";
import UeberUns from "./pages/UeberUns";
import RegisterEmployer from "./pages/RegisterEmployer";
import Login from "./pages/Login";
import EmployerDashboard from "./pages/EmployerDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/karrieretipps" element={<Karrieretipps />} />
          <Route path="/karriere-tipps" element={<Karrieretipps />} />
          <Route path="/loesungen" element={<Loesungen />} />
          <Route path="/fuer-arbeitgeber" element={<FuerArbeitgeber />} />
          <Route path="/arbeitgeber" element={<FuerArbeitgeber />} />
          <Route path="/ueber-uns" element={<UeberUns />} />
          <Route path="/register-employer" element={<RegisterEmployer />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<EmployerDashboard />} />
          <Route path="/admin-upload" element={<AdminUpload />} />
          <Route path="/admin-applications" element={<AdminApplications />} />
          <Route path="/admin-dashboard" element={<AdminDashboardLegacy />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
