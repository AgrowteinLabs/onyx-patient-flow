import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Smartphone, 
  Globe2, 
  Save,
  Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Settings = () => {
  const { toast } = useToast();
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSaveSettings = () => {
    setSaveLoading(true);
    setTimeout(() => {
      setSaveLoading(false);
      toast({
        title: "Settings Saved",
        description: "Your notification and security settings have been updated."
      });
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-[#2563eb]" /> Portal Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage notification channels, billing, and portal security options</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Settings cards */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Notification settings */}
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#2563eb]" /> Notifications Preferences
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">Configure how you receive test results and booking reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-700">Email Alerts</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Receive copy of clinical reports in your mailbox</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={emailNotif} 
                  onChange={() => setEmailNotif(!emailNotif)}
                  className="h-4 w-4 text-[#2563eb] rounded border-slate-300 focus:ring-[#2563eb]" 
                />
              </div>

              <div className="flex items-center justify-between py-2.5 border-t">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-700">SMS Reminders</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Receive reminders on your phone 1 hour before slots</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={smsNotif} 
                  onChange={() => setSmsNotif(!smsNotif)}
                  className="h-4 w-4 text-[#2563eb] rounded border-slate-300 focus:ring-[#2563eb]" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Security details */}
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#2563eb]" /> Privacy & Security
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">Enable HIPAA compliant options to secure medical files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-700">Biometric Login Reminder</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Allow logging in with saved keys on mobile browsers</p>
                </div>
                <Badge className="bg-slate-100 text-slate-500 font-bold border-none text-[8px]">Available on App</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Save Action */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings}
              className="bg-[#2563eb] text-white font-bold rounded-xl shadow-md h-10 px-5 text-xs"
              disabled={saveLoading}
            >
              <Save className="h-4 w-4 mr-2" /> {saveLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>

        </div>

        {/* Right Info pane */}
        <div className="md:col-span-4 space-y-6">
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px] p-5">
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4.5 w-4.5 text-[#2563eb]" />
                <span className="font-bold">App Version:</span>
                <span className="ml-auto font-semibold text-slate-800">1.0.4-stable</span>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t">
                <Globe2 className="h-4.5 w-4.5 text-[#2563eb]" />
                <span className="font-bold">Encryption:</span>
                <span className="ml-auto font-semibold text-emerald-600">SSL 256-bit</span>
              </div>
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
};

export default Settings;
