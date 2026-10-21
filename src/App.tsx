import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";

/* =======================
   Public Pages
======================= */
import Index from "./pages/Index";
import LoginPage from "./components/auth/LoginPage";
import NotFound from "./pages/NotFound";
import HandoverLanding from "./pages/HandoverLanding";

/* =======================
   Dashboards (Layouts)
======================= */
import UserDashboard from "./pages/dashboard/user/UserDashboard";

/* =======================
   User pages
======================= */
import Profiles from "./pages/dashboard/user/Profiles";
import Appointments from "./pages/dashboard/user/Appointments";
import ReportsPage from "./pages/dashboard/user/ReportsPage";
import Prescriptions from "./pages/dashboard/user/Prescriptions";
import Consultations from "./pages/dashboard/user/Consultations";
import Doctors from "./pages/dashboard/user/Doctors";
import Tickets from "./pages/dashboard/user/Tickets";
import Settings from "./pages/dashboard/user/Settings";
import Payments from "./pages/dashboard/shared/Payments";

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
   Seamless Handover Route Aliases
=============================== */
const ConsultationRoomRedirect = () => {
  const { bookingId } = useParams();
  return <Navigate to={`/dashboard/user/consultations?bookingId=${bookingId || ""}&autoJoin=true`} replace />;
};

const ConsultationSelectDoctorRedirect = () => {
  const [searchParams] = useSearchParams();
  return <Navigate to={`/dashboard/user/appointments?${searchParams.toString()}`} replace />;
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
          <Route path="/handover" element={<HandoverLanding />} />
          <Route path="/consultation/room/:bookingId" element={<ConsultationRoomRedirect />} />
          <Route path="/consultation/select-doctor" element={<ConsultationSelectDoctorRedirect />} />

          {/* =======================
              USER (PATIENT) ROUTES
          ======================== */}
          <Route element={<ProtectedRoute allowedRoles={["user", "executive", "executive-admin"]} />}>
            <Route path="/dashboard/user" element={<UserDashboard />}>
              <Route index element={<Appointments />} />
              <Route path="profiles" element={<Profiles />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="prescriptions" element={<Prescriptions />} />
              <Route path="consultations" element={<Consultations />} />
              <Route path="doctors" element={<Doctors />} />
              <Route path="tickets" element={<Tickets />} />
              <Route path="settings" element={<Settings />} />
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
