import { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { apiRequest } from "@/lib/api-request";
import { listOrganizations } from "@/services/organization.service";
import { listPermissions } from "@/services/permission.service";
import { PermissionMultiSelect } from "./PermissionMultiSelect";

interface RoleCreationDialogProps {
  role: "cluster-head" | "user-head" | "nurse" | "technician";
  title: string;
  createApi: string;
  verifyApi: string;
  defaultPermissions?: string[];
  requiresOrganization?: boolean;
  requiresLocation?: boolean;
}

const RoleCreationDialog = ({
  role,
  title,
  createApi,
  verifyApi,
  defaultPermissions = [],
  requiresOrganization = true,
  requiresLocation = true,
}: RoleCreationDialogProps) => {
  const { toast } = useToast();

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verifyDialog, setVerifyDialog] = useState(false);

  // Form fields
  const [otp, setOtp] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [permissionOptions, setPermissionOptions] = useState<{ label: string; value: string }[]>([]);
  const [permissions, setPermissions] = useState<string[]>(defaultPermissions);

  const [form, setForm] = useState({
    name: "",
    country: "India",
    phone_country: "91",
    phone_number: "",
    password: "",
    organizationName: "",
    location: { line1: "", line2: "", line3: "" },
  });

  // ================================
  // Fetch organizations (for dropdown)
  // ================================
  useEffect(() => {
    if (requiresOrganization) {
      (async () => {
        try {
          const res = await listOrganizations();
          const orgs = res.organizations || res;
          setOrganizations(orgs);
        } catch (err) {
          console.error("Failed to fetch organizations", err);
          toast({ title: "Failed to load organizations", variant: "destructive" });
        }
      })();
    }
  }, [requiresOrganization, toast]);

  // ================================
  // Fetch permissions dynamically
  // ================================
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await listPermissions();
        const perms = res.permissions || res; // depends on API format
        setPermissionOptions(
          perms.map((p: string) => ({
            label: p.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            value: p,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch permissions:", err);
        toast({ title: "Failed to load permissions", variant: "destructive" });
      }
    };
    fetchPermissions();
  }, [toast]);

  // ================================
  // Handle create role (send OTP)
  // ================================
  const handleCreate = async () => {
    const { name, phone_country, phone_number, password, country, organizationName, location } = form;

    if (!name || !phone_number || !password) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const payload: any = {
      phone_number: [phone_country, phone_number],
      permissions,
      password,
      name,
      country,
    };

    if (requiresOrganization) payload.organizationName = organizationName;
    if (requiresLocation) payload.location = location;

    try {
      const res = await apiRequest(createApi, { method: "POST", data: payload });
      if (res.success === false) throw new Error("API responded with failure");

      setPendingPhone(`${phone_country}${phone_number}`);
      setDialogOpen(false);
      setVerifyDialog(true);
      toast({ title: "OTP sent for verification" });
    } catch (err) {
      console.error("Error creating role:", err);
      toast({ title: `Failed to create ${role}`, variant: "destructive" });
    }
  };

  // ================================
  // Verify OTP
  // ================================
  const handleVerify = async () => {
    try {
      const res = await apiRequest(verifyApi, {
        method: "POST",
        data: { phone_number: [form.phone_country, form.phone_number], otp },
      });

      if (res.success === false) throw new Error("Invalid OTP");
      setVerifyDialog(false);
      toast({ title: `${title} verified successfully ✅` });
    } catch (err) {
      console.error("Verification failed:", err);
      toast({ title: "Verification failed", variant: "destructive" });
    }
  };

  // ================================
  // JSX Render
  // ================================
  return (
    <>
      {/* =============== CREATE DIALOG =============== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gradient-primary text-white">
            <Plus className="h-4 w-4 mr-2" />
            {title}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-3">
            <Input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Code"
                className="w-20"
                value={form.phone_country}
                onChange={(e) => setForm({ ...form, phone_country: e.target.value })}
              />
              <Input
                placeholder="Phone Number"
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              />
            </div>
            <Input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            {requiresOrganization && (
              <Select
                value={form.organizationName}
                onValueChange={(v) => setForm({ ...form, organizationName: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org: any) => (
                    <SelectItem key={org.id || org._id} value={org.organizationName}>
                      {org.organizationName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <PermissionMultiSelect
              options={permissionOptions}
              value={permissions}
              onChange={setPermissions}
              placeholder="Select Permissions"
            />

            {requiresLocation && (
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Address Line 1"
                  value={form.location.line1}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      location: { ...form.location, line1: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Line 2"
                  value={form.location.line2}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      location: { ...form.location, line2: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Line 3"
                  value={form.location.line3}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      location: { ...form.location, line3: e.target.value },
                    })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =============== OTP VERIFY DIALOG =============== */}
      <Dialog open={verifyDialog} onOpenChange={setVerifyDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Verify OTP</DialogTitle>
          </DialogHeader>

          <p className="text-muted-foreground">
            An OTP has been sent to <b>+{pendingPhone}</b>.
          </p>

          <Input
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify}>Verify</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RoleCreationDialog;
