import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Bell, Search, LogOut, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/api-request";
import { getProfiles, Profile } from "@/services/profile.service";
import { logout } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  _id: string;
  name: string;
  role: string;
  country: string;
  phone_number: string[];
  status: string;
  userCode: string;
}

const Topbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  // Fetch user details & linked profiles
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<UserData>("/view/user", { method: "GET" });
      setUser(res);

      const profileList = await getProfiles();
      setProfiles(profileList || []);

      // Determine active selected profile
      const storedProfileId = localStorage.getItem("selectedProfileId");
      if (profileList && profileList.length > 0) {
        const activeProfile = profileList.find(p => p._id === storedProfileId || p.id === storedProfileId) || profileList[0];
        setSelectedProfile(activeProfile);
        localStorage.setItem("selectedProfileId", activeProfile._id || activeProfile.id || "");
      }
    } catch (err) {
      console.error("❌ Failed to fetch user or profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProfileSwitch = (profile: Profile) => {
    const id = profile._id || profile.id || "";
    localStorage.setItem("selectedProfileId", id);
    setSelectedProfile(profile);
    toast({
      title: "Profile Switched",
      description: `Now viewing dashboard for ${profile.name}`,
    });
    // Dispatch a custom event to notify components that the profile changed
    window.dispatchEvent(new Event("profileChanged"));
    // Wait a brief moment then reload to refresh all data
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Signed out successfully" });
    navigate("/login");
  };

  return (
    <header className="h-[80px] flex items-center justify-between px-8 mx-2 mb-4 bg-white/70 backdrop-blur-xl rounded-[20px] border border-white/80 shadow-md z-10 relative">
      {/* Left side – Hospital Logo & Branding */}
      <div className="flex items-center gap-4">
        <div className="flex items-center cursor-pointer" onClick={() => navigate("/dashboard/user")}>
          <img src="/ONYXHPLOGO.png" alt="Onyx Health+" className="h-11 w-auto object-contain" />
        </div>
      </div>

      {/* Middle side – Search Bar */}
      <div className="hidden md:flex items-center relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search records, appointments, doctors..."
          className="w-full bg-slate-50 border border-slate-200/80 rounded-full h-[40px] pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Right side – Actions, Profile Switcher & User Menu */}
      <div className="flex items-center gap-4">
        
        {/* Notification Bell */}
        <button className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 relative transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
        </button>

        {/* Global Family Profile Switcher */}
        {!loading && profiles.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 px-3 h-10 rounded-full border-slate-200/80 hover:bg-slate-50 bg-white shadow-sm transition-all">
                <Users className="h-4 w-4 text-[#0ea5e9]" />
                <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                  {selectedProfile ? selectedProfile.name : "Select Profile"}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-[16px] shadow-lg border border-slate-100 p-1">
              <DropdownMenuLabel className="text-slate-400 text-[10px] font-bold uppercase tracking-wider px-3 py-2">
                Switch Patient Profile
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profiles.map((p) => {
                const isSelected = selectedProfile && (p._id === selectedProfile._id || p.id === selectedProfile.id);
                return (
                  <DropdownMenuItem
                    key={p._id || p.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer ${
                      isSelected ? "bg-[#0ea5e9]/10 text-[#2563eb]" : "text-slate-700 hover:bg-slate-50"
                    }`}
                    onClick={() => handleProfileSwitch(p)}
                  >
                    <span>{p.name} {p.isMain ? "(Self)" : "(Family)"}</span>
                    {isSelected && <span className="h-2 w-2 rounded-full bg-[#2563eb]"></span>}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-1 pr-3 h-12 rounded-full hover:bg-slate-100 transition-colors shrink-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#0ea5e9] to-[#2563eb] flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm">
                {user?.name ? user.name[0] : "P"}
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 rounded-[16px] shadow-xl border border-slate-100 p-2">
            <DropdownMenuLabel className="pb-1 text-slate-700">Account Owner</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {loading ? (
              <div className="p-3 text-xs text-slate-400">Loading profile...</div>
            ) : (
              <div className="p-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="font-semibold text-slate-800">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">User Code:</span>
                  <span className="font-mono text-slate-800">{user?.userCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-semibold text-slate-800">+{user?.phone_number?.join(" ")}</span>
                </div>
              </div>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer rounded-lg text-xs" onClick={() => navigate("/dashboard/user/profiles")}>
              <Users className="mr-2 h-4 w-4 text-slate-500" />
              Manage Profiles
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg text-xs" onClick={() => navigate("/dashboard/user/settings")}>
              <Settings className="mr-2 h-4 w-4 text-slate-500" />
              Portal Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-rose-600 font-semibold cursor-pointer rounded-lg text-xs" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Topbar;
