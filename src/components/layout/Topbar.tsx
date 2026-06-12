import { useEffect, useState } from "react";
import { ChevronDown, ShieldCheck, Globe2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-request";

interface UserData {
  _id: string;
  name: string;
  role: string;
  country: string;
  phone_number: string[];
  status: string;
  userCode: string;
  permissions: string[];
  devices: string | string[];
}

const Topbar = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user details
  const fetchUser = async () => {
    try {
      const res = await apiRequest("/view/user", { method: "GET" });
      setUser(res);
    } catch (err) {
      console.error("❌ Failed to fetch user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Role color logic
  const roleColors: Record<string, string> = {
    super_admin: "bg-rose-500/10 text-rose-600 border border-rose-500/20",
    executive_admin: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
    cluster_head: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
    user_head: "bg-violet-500/10 text-violet-600 border border-violet-500/20",
    nurse: "bg-pink-500/10 text-pink-600 border border-pink-500/20",
    technician: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  };

  const roleBadge = (
    <Badge className={`${roleColors[user?.role || ""] || "bg-muted text-foreground"} capitalize`}>
      {user?.role?.replace(/_/g, " ")}
    </Badge>
  );

  return (
    <header className="h-[72px] flex items-center justify-between px-8 mx-2 mb-4 bg-white/60 backdrop-blur-xl rounded-[24px] border border-white/80 shadow-sm z-10 relative">
      {/* Left side – Branding or section title */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-[#2d3748]">
          Onyx Health+ Dashboard
        </h1>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Smart Health Administration</p>
      </div>

      {/* Right side – User Section */}
      <div className="flex items-center gap-4">


        {/* User Info + Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-3 h-12 rounded-full hover:bg-white/80 transition-colors">
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#c850c0] to-[#ffcc70] flex items-center justify-center text-white font-bold text-lg uppercase shadow-sm shrink-0">
                {user?.name ? user.name[0] : "U"}
              </div>

              {/* Info */}
              {loading ? (
                <Skeleton className="h-10 w-40 rounded-full" />
              ) : (
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-bold text-[#2d3748] leading-none">{user?.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {roleBadge}
                    {user?.status === "Active" && (
                      <span className="text-[10px] font-bold text-[#137333] flex items-center gap-1 uppercase tracking-wider bg-[#e6f4ea] px-2 py-0.5 rounded-full">
                        <ShieldCheck className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                </div>
              )}

              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-72 shadow-lg">
            <DropdownMenuLabel>Account Overview</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading user info...</div>
            ) : (
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium capitalize">
                    {user?.role?.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User Code:</span>
                  <span className="font-medium">{user?.userCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Globe2 className="h-3 w-3" /> Country:
                  </span>
                  <span className="font-medium">{user?.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Smartphone className="h-3 w-3" /> Phone:
                  </span>
                  <span className="font-medium">
                    +{user?.phone_number?.join(" ")}
                  </span>
                </div>
              </div>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Notification Preferences</DropdownMenuItem>
            <DropdownMenuItem>Help & Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive font-semibold">
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Topbar;
