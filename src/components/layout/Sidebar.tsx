import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Pill,
  Video,
  Stethoscope,
  Ticket,
  Settings,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { logout } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";

/* ============================================================
   PATIENT ONLY SIDEBAR
============================================================ */

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState("");

  /* Load correct role */
  useEffect(() => {
    setUserRole("user");
  }, []);

  /* Role-based navigation */
  const NAV: Record<string, any[]> = {
    "user": [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard/user",
      },
      {
        label: "My Profiles",
        icon: Users,
        path: "/dashboard/user/profiles",
      },
      {
        label: "Appointments",
        icon: Calendar,
        path: "/dashboard/user/appointments",
      },
      {
        label: "Reports",
        icon: FileText,
        path: "/dashboard/user/reports",
      },
      {
        label: "Prescriptions",
        icon: Pill,
        path: "/dashboard/user/prescriptions",
      },
      {
        label: "Consultations",
        icon: Video,
        path: "/dashboard/user/consultations",
      },
      {
        label: "Doctors",
        icon: Stethoscope,
        path: "/dashboard/user/doctors",
      },
      {
        label: "Support Tickets",
        icon: Ticket,
        path: "/dashboard/user/tickets",
      },
      {
        label: "Settings",
        icon: Settings,
        path: "/dashboard/user/settings",
      },
    ],
  };

  const items = NAV[userRole] || [];

  /* Active state check */
  const isActive = (path: string) => location.pathname === path;

  const toggleCollapse = () => setCollapsed((prev) => !prev);

  /* ============================================================
      UI RENDER
  ============================================================= */

  return (
    <aside
      className={cn(
        "glass-panel flex flex-col transition-all duration-300 rounded-[30px] my-2 ml-2 shadow-2xl relative border-none z-20 overflow-hidden",
        collapsed ? "w-20" : "w-[280px]"
      )}
    >
      {/* HEADER */}
      <div className={cn("h-20 flex items-center px-4 pt-4 relative", collapsed ? "justify-center" : "justify-between")}>
        <div className="flex items-center gap-3 transition-all">
          <button 
            onClick={toggleCollapse}
            className="h-12 w-12 rounded-[20px] bg-white flex items-center justify-center shadow-sm shrink-0 hover:scale-105 active:scale-95 transition-all"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-[#2d3748]">
              <path fillRule="evenodd" d="M3 2.25a.75.75 0 000 1.5v16.5h16.5a.75.75 0 001.5 0V3.75a.75.75 0 00-.75-.75H3zM4.5 3.75v15h15v-15h-15z" clipRule="evenodd" />
              <path d="M9.75 9a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" />
            </svg>
          </button>

          {!collapsed && (
            <div className="flex flex-col justify-center">
              <h2 className="font-extrabold text-lg text-[#2d3748] tracking-tight leading-tight">Onyx Health+</h2>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-0.5">
                Patient Portal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {items.map((item) => {
          return (
            <div key={item.path}>
              <button
                className={cn(
                  "w-full flex items-center justify-between px-2 py-2 rounded-[20px] transition-all duration-200 border-none",
                  isActive(item.path)
                    ? "bg-white/70 shadow-sm text-[#2d3748]"
                    : "hover:bg-white/40 text-gray-500 hover:text-gray-800",
                  collapsed && "justify-center"
                )}
                onClick={() => navigate(item.path)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-full flex items-center justify-center transition-colors",
                    isActive(item.path) ? "bg-white shadow-md text-[#2d3748]" : "text-gray-400"
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  {!collapsed && <span className="font-bold text-sm tracking-wide">{item.label}</span>}
                </div>
              </button>
            </div>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="mt-auto p-4 flex justify-center pb-6">
        {collapsed ? (
          <button
            className="h-12 w-12 bg-[#eb4e4e] rounded-[18px] flex items-center justify-center text-white shadow-lg hover:opacity-90 transition-opacity"
            onClick={() => {
              logout();
              toast({ title: "Signed out" });
              navigate("/login");
            }}
          >
            <LogOut className="h-5 w-5" />
          </button>
        ) : (
          <button
            className="w-full flex items-center justify-start bg-[#fce8e6] text-[#c5221f] hover:bg-[#fad2cf] rounded-[24px] p-2 pr-4 transition-colors"
            onClick={() => {
              logout();
              toast({ title: "Signed out" });
              navigate("/login");
            }}
          >
            <div className="h-10 w-10 bg-[#eb4e4e] rounded-[18px] flex items-center justify-center text-white mr-3 shadow-md shrink-0">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm tracking-wide">Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
