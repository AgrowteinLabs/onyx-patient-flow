import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { FileText, Video, Stethoscope, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { viewUser } from "@/services/user.service";
import { listSessions } from "@/services/session.service";
import { listReportsByUser } from "@/services/report.service";

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMainDashboard = location.pathname === "/dashboard/user" || location.pathname === "/dashboard/user/";

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    reports: 0,
    sessions: 0,
    consultations: 0,
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const user = await viewUser();
      const userId = user.id || user._id;

      const [sessionsData, reportsData] = await Promise.allSettled([
        listSessions(),
        listReportsByUser(userId),
      ]);

      const sessionsCount = sessionsData.status === "fulfilled" ? (sessionsData.value?.length || 0) : 0;
      const reportsCount = reportsData.status === "fulfilled" ? (reportsData.value?.length || 0) : 0;

      setStats({
        reports: reportsCount,
        sessions: sessionsCount,
        consultations: 0,
      });
    } catch (err) {
      console.error("Failed to load patient dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMainDashboard) {
      fetchStats();
    }
  }, [isMainDashboard]);

  return (
    <DashboardLayout>
      {isMainDashboard ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Patient Dashboard</h1>
            <p className="text-muted-foreground mt-1">Your health overview</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Medical Reports"
              value={loading ? "..." : stats.reports.toString()}
              icon={FileText}
              variant="primary"
            />
            <StatCard
              title="Sessions"
              value={loading ? "..." : stats.sessions.toString()}
              icon={Video}
              variant="secondary"
            />
            <StatCard
              title="Consultations"
              value={stats.consultations.toString()}
              icon={Stethoscope}
              variant="default"
            />
            <StatCard
              title="Health Score"
              value="85%"
              icon={Activity}
              variant="success"
            />
          </div>

          <div className="bg-card rounded-lg shadow-card p-6">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="gradient-primary h-auto py-6 flex flex-col gap-2 text-white"
                onClick={() => navigate("/dashboard/user/consultancy")}
              >
                <Stethoscope className="h-6 w-6" />
                <span className="font-semibold">Book Consultation</span>
              </Button>
              <Button 
                variant="secondary" 
                className="h-auto py-6 flex flex-col gap-2"
                onClick={() => navigate("/dashboard/user/reports")}
              >
                <FileText className="h-6 w-6" />
                <span className="font-semibold">View Reports</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col gap-2"
                onClick={() => navigate("/dashboard/user/sessions")}
              >
                <Video className="h-6 w-6" />
                <span className="font-semibold">Join Session</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg shadow-card p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Reports Overview</h3>
              <div className="space-y-3">
                {stats.reports === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No reports available</p>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    You have {stats.reports} reports available in the Reports tab.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-card p-6">
              <h3 className="text-xl font-semibold mb-4">Diagnostic Sessions Overview</h3>
              <div className="space-y-3">
                {stats.sessions === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No sessions available</p>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    You have {stats.sessions} diagnostic sessions available in the Sessions tab.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <Outlet />
        </div>
      )}
    </DashboardLayout>
  );
};

export default UserDashboard;
