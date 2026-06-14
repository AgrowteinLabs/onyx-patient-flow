import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

/* =======================
   Public Pages
======================= */
import Index from "./pages/Index";
import LoginPage from "./components/auth/LoginPage";
import NotFound from "./pages/NotFound";

/* =======================
   Dashboards (Layouts)
======================= */
import UserDashboard from "./pages/dashboard/user/UserDashboard";

/* =======================
   User pages
======================= */
import Sessions from "./pages/dashboard/user/Sessions";
import Consultancy from "./pages/dashboard/user/Consultancy";
import Profile from "./pages/dashboard/user/Profile";
import Payments from "./pages/dashboard/shared/Payments";
import EA_Reports from "./pages/dashboard/executive-admin/EA_Reports";

import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

/* ===============================
   Route Logger (Debug)
=============================== */
const RouteLogger = () => {
  const location = useLocation();
  useEffect(() => {
    console.log("🗺️ Route changed:", location.pathname);
  }, [location]);
  return null;
};

/* ===============================
   Auto Redirect After Login
=============================== */
const AutoRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    let role = localStorage.getItem("userRole");

    if (token && role) {
      role = role.replace(/_/g, "-").toLowerCase();
      localStorage.setItem("userRole", role);

      const targetRole = (role === "executive" || role === "executive-admin") ? "user" : role;

      const homeRoutes = ["/", "/login", "/signup"];
      if (homeRoutes.includes(location.pathname)) {
        navigate(`/dashboard/${targetRole}`);
      }
    }
  }, [navigate, location.pathname]);

  return null;
};

/* ===============================
   MAIN APP
=============================== */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteLogger />
        <AutoRedirect />

        <Routes>
          {/* 🔓 Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage />} />

          {/* =======================
              USER (PATIENT) ROUTES
          ======================== */}
          <Route element={<ProtectedRoute allowedRoles={["user", "executive", "executive-admin"]} />}>
            <Route path="/dashboard/user" element={<UserDashboard />}>
              <Route index element={<Profile />} />
              <Route path="profile" element={<Profile />} />
              <Route path="reports" element={<EA_Reports />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="consultancy" element={<Consultancy />} />
              <Route path="payments" element={<Payments />} />
            </Route>
          </Route>

          {/* ❌ Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
