import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden bg-dashboard-wavy p-4">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden pl-4">
        <Topbar />
        <main className="flex-1 overflow-y-auto pt-6 pb-2 pr-2">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
