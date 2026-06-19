import { useEffect, useState, useCallback } from "react";
import { getProfiles, createProfile, updateProfile, deleteProfile, Profile } from "@/services/profile.service";
import { listSessions } from "@/services/session.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  User, 
  UserCheck,
  CheckCircle,
  Shield,
  ShieldAlert,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AbdmFlowDialog } from "@/components/abdm/AbdmFlowDialog";
import { AbdmCardDialog } from "@/components/abdm/AbdmCardDialog";
import { unlinkAbha } from "@/services/abdm.service";

const Profiles = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    localStorage.getItem("selectedProfileId")
  );

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // ABDM States
  const [abdmFlowOpen, setAbdmFlowOpen] = useState(false);
  const [abdmCardOpen, setAbdmCardOpen] = useState(false);
  const [abdmProfileId, setAbdmProfileId] = useState<string | null>(null);
  const [abdmProfileName, setAbdmProfileName] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmiPreview, setBmiPreview] = useState<number | null>(null);

  useEffect(() => {
    if (height && weight) {
      const hVal = Number(height);
      const wVal = Number(weight);
      if (hVal > 0 && wVal > 0) {
        const hMeter = hVal / 100;
        setBmiPreview(parseFloat((wVal / (hMeter * hMeter)).toFixed(1)));
      } else {
        setBmiPreview(null);
      }
    } else {
      setBmiPreview(null);
    }
  }, [height, weight]);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getProfiles();
      setProfiles(list || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load profiles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleUnlinkAbha = async (profileId: string) => {
    if (!window.confirm("Are you sure you want to remove this ABHA link? This only unlinks it from Onyx; your national ABHA account will remain active.")) {
      return;
    }
    try {
      await unlinkAbha(profileId);
      toast({ title: "ABHA unlinked successfully" });
      loadProfiles();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to unlink ABHA", variant: "destructive" });
    }
  };

  const handleOpenCreate = () => {
    setDialogMode("create");
    setName("");
    setDob("");
    setGender("Male");
    setBloodGroup("O+");
    setPhone("");
    setEmail("");
    setHeight("");
    setWeight("");
    setOpenDialog(true);
  };

  const handleOpenEdit = (profile: Profile) => {
    setDialogMode("edit");
    setEditingProfileId(profile._id || profile.id || null);
    setName(profile.name);
    
    const formattedDob = profile.dob ? profile.dob.split("T")[0] : "";
    setDob(formattedDob);
    
    setGender(profile.gender || "Male");
    setBloodGroup(profile.blood_group || profile.bloodGroup || "O+");
    
    const storedPhone = profile.phone_number ? profile.phone_number.slice(1).join("") : "";
    setPhone(storedPhone);
    
    setEmail(profile.email || "");
    setHeight(profile.height ? String(profile.height) : "");
    setWeight(profile.weight ? String(profile.weight) : "");
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dob) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    let countryCode = "91";
    let localPhone = phone.trim();
    if (localPhone.startsWith("+")) {
      const match = localPhone.match(/^\+(\d+)\s*(.*)$/);
      if (match) {
        countryCode = match[1];
        localPhone = match[2].replace(/\D/g, "");
      }
    } else if (localPhone.length > 10) {
      countryCode = localPhone.slice(0, localPhone.length - 10);
      localPhone = localPhone.slice(localPhone.length - 10);
    } else {
      localPhone = localPhone.replace(/\D/g, "");
    }

    const payload: any = {
      name,
      dob,
      gender,
      blood_group: bloodGroup,
      phone_number: [countryCode, localPhone || "9999999999"],
    };

    if (email.trim()) payload.email = email.trim();
    if (height.trim()) payload.height = Number(height);
    if (weight.trim()) payload.weight = Number(weight);
    
    if (height.trim() && weight.trim()) {
      const hMeter = Number(height) / 100;
      payload.bmi = parseFloat((Number(weight) / (hMeter * hMeter)).toFixed(1));
    }

    try {
      if (dialogMode === "create") {
        let prodId = "60d5ec4b1234567890abcdef";
        try {
          const sessionsList = await listSessions();
          if (sessionsList && sessionsList.length > 0) {
            const firstSession = sessionsList[0];
            prodId = firstSession.productId?._id || firstSession.productId || prodId;
          }
        } catch (sessionErr) {
          console.warn("Could not retrieve productId from sessions:", sessionErr);
        }

        payload.productId = prodId;
        await createProfile(payload);
        toast({ title: "Profile created successfully" });
      } else if (dialogMode === "edit" && editingProfileId) {
        await updateProfile(editingProfileId, payload);
        toast({ title: "Profile updated successfully" });
      }
      setOpenDialog(false);
      loadProfiles();
    } catch (err) {
      console.error(err);
      toast({ title: "Operation failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this profile?")) return;
    try {
      await deleteProfile(id);
      toast({ title: "Profile deleted successfully" });
      if (selectedProfileId === id) {
        localStorage.removeItem("selectedProfileId");
        setSelectedProfileId(null);
      }
      loadProfiles();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to delete profile", variant: "destructive" });
    }
  };

  const handleSwitchProfile = (id: string) => {
    localStorage.setItem("selectedProfileId", id);
    setSelectedProfileId(id);
    toast({ title: "Active profile switched" });
    window.dispatchEvent(new Event("profileChanged"));
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-[#2563eb]" /> Family Profiles
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage health files and profiles linked to this account</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all">
          <Plus className="h-4 w-4 mr-2" /> Add Family Profile
        </Button>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-white rounded-[20px] shadow-sm animate-pulse border border-slate-100"></div>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-200">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4 animate-bounce" />
          <h3 className="font-extrabold text-slate-700">No profiles found</h3>
          <p className="text-slate-500 text-xs mt-1">Add profiles for family members to manage their reports and visits.</p>
          <Button onClick={handleOpenCreate} className="mt-4 bg-[#2563eb]">Create First Profile</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((p) => {
            const id = p._id || p.id || "";
            const isSelected = selectedProfileId === id;
            return (
              <Card 
                key={id}
                className={`bg-white border rounded-[20px] transition-all duration-300 shadow-sm relative overflow-hidden flex flex-col justify-between ${
                  isSelected ? "border-[#2563eb] ring-2 ring-[#2563eb]/10 shadow-md" : "border-slate-100 hover:border-slate-300 hover:shadow-md"
                }`}
              >
                {/* Header Banner */}
                <div className={`h-2.5 w-full ${isSelected ? "bg-[#2563eb]" : "bg-slate-100"}`}></div>
                
                <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  {/* Top block */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-slate-50 border flex items-center justify-center text-[#2563eb] font-bold text-lg uppercase shadow-sm">
                        {p.name[0]}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm tracking-wide flex items-center gap-1.5">
                          {p.name}
                          {isSelected && <Badge className="bg-[#2563eb]/10 text-[#2563eb] border-none text-[8px] font-bold px-1.5 py-0.5">Active</Badge>}
                        </h3>
                        <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-500 border-none text-[9px] font-bold capitalize">
                          {p.isMain ? "Primary Profile" : "Family Member"}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full" onClick={() => handleOpenEdit(p)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full" onClick={() => handleDelete(id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="grid grid-cols-3 gap-2 text-xs border-t border-b border-slate-50 py-3 bg-slate-50/20 rounded-lg">
                    <div className="text-center">
                      <span className="text-slate-400 text-[10px] block font-medium">Age</span>
                      <span className="font-bold text-slate-700">{p.age ? `${p.age} Yrs` : "N/A"}</span>
                    </div>
                    <div className="text-center border-l border-r border-slate-100">
                      <span className="text-slate-400 text-[10px] block font-medium">Gender</span>
                      <span className="font-bold text-slate-700 capitalize truncate block">{p.gender || "N/A"}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-400 text-[10px] block font-medium">Blood</span>
                      <span className="font-bold text-[#e11d48]">{p.blood_group || p.bloodGroup || "N/A"}</span>
                    </div>
                  </div>

                  {/* Additional Medical Specs */}
                  {(p.height || p.weight || p.bmi || p.email) && (
                    <div className="space-y-1.5 text-[11px] text-slate-500 pt-1 border-t border-dashed border-slate-100">
                      {p.email && (
                        <div className="flex justify-between">
                          <span>Email:</span>
                          <span className="font-semibold text-slate-700 truncate max-w-[150px]">{p.email}</span>
                        </div>
                      )}
                      {(p.height || p.weight) && (
                        <div className="flex justify-between">
                          <span>Height / Weight:</span>
                          <span className="font-semibold text-slate-700">
                            {p.height ? `${p.height} cm` : "-"} / {p.weight ? `${p.weight} kg` : "-"}
                          </span>
                        </div>
                      )}
                      {p.bmi && (
                        <div className="flex justify-between">
                          <span>BMI:</span>
                          <span className="font-semibold text-[#0ea5e9]">
                            {p.bmi} ({p.bmi < 18.5 ? "Underweight" : p.bmi < 25 ? "Normal" : p.bmi < 30 ? "Overweight" : "Obese"})
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ABHA / ABDM Section */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {(!p.abhaStatus || p.abhaStatus === "NONE") && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-600">ABHA Health ID</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] font-extrabold text-[#2563eb] hover:text-[#2563eb]/95 hover:bg-[#2563eb]/5 rounded-lg px-2.5"
                          onClick={() => {
                            setAbdmProfileId(id);
                            setAbdmProfileName(p.name);
                            setAbdmFlowOpen(true);
                          }}
                        >
                          Link ABHA
                        </Button>
                      </div>
                    )}

                    {p.abhaStatus === "LINKED" && (
                      <div className="p-3 rounded-xl bg-emerald-50/20 border border-emerald-100/50 space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-[10px] uppercase tracking-wide">
                            <Shield className="h-3.5 w-3.5" />
                            <span>ABHA Linked</span>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[8px] px-1.5 py-0.5">
                            Verified
                          </Badge>
                        </div>
                        <div className="text-[11px] space-y-0.5">
                          <div className="flex justify-between text-slate-500 font-medium">
                            <span>Number:</span>
                            <span className="font-bold text-slate-800 tracking-wider">{p.abhaNumber}</span>
                          </div>
                          <div className="flex justify-between text-slate-500 font-medium">
                            <span>Address:</span>
                            <span className="font-bold text-slate-800 lowercase">{p.abhaAddress}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-[10px] font-extrabold rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
                            onClick={() => {
                              setAbdmProfileId(id);
                              setAbdmProfileName(p.name);
                              setAbdmCardOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" /> View Card
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 size-7 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100"
                            onClick={() => handleUnlinkAbha(id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {p.abhaStatus === "DEACTIVATED" && (
                      <div className="p-3 rounded-xl bg-rose-50/20 border border-rose-100/50 space-y-2 text-left">
                        <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-[10px] uppercase tracking-wide">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>ABHA Deactivated</span>
                        </div>
                        <p className="text-[9px] text-rose-600 leading-normal font-medium bg-rose-50/80 p-1.5 rounded-lg border border-rose-100/30">
                          Deactivated nationally. Please reactivate via your government portal.
                        </p>
                        <div className="text-[11px] space-y-0.5">
                          <div className="flex justify-between text-slate-500 font-medium">
                            <span>Number:</span>
                            <span className="font-bold text-slate-800 tracking-wider">{p.abhaNumber}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-[10px] font-extrabold rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
                            onClick={() => {
                              setAbdmProfileId(id);
                              setAbdmProfileName(p.name);
                              setAbdmCardOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" /> View Card
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 size-7 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100"
                            onClick={() => handleUnlinkAbha(id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA switches profile */}
                  {!isSelected ? (
                    <Button 
                      variant="outline" 
                      className="w-full text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm"
                      onClick={() => handleSwitchProfile(id)}
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Set Active Profile
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center py-2 text-slate-500 font-bold text-xs bg-slate-50 rounded-xl border border-slate-100">
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> Currently Active
                    </div>
                  )}

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md rounded-[20px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-xl flex items-center gap-2">
              <User className="h-5 w-5 text-[#2563eb]" /> {dialogMode === "create" ? "Add Family Profile" : "Edit Profile Details"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Fill out the details below to link this profile with this portal account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-slate-700">Full Name *</Label>
              <Input
                placeholder="Enter patient full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700">Date of Birth *</Label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700">Gender *</Label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white h-10 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700">Height (cm)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 170"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700">Weight (kg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 65"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700">Blood Group</Label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white h-10 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-bold text-slate-700">Contact Number</Label>
                <Input
                  type="tel"
                  placeholder="Enter contact phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-slate-700">Email Address</Label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-slate-200"
              />
            </div>

            {bmiPreview !== null && (
              <div className="p-3 bg-[#0ea5e9]/5 border border-[#0ea5e9]/10 rounded-xl flex items-center justify-between text-xs text-slate-700">
                <span className="font-semibold">Calculated BMI Preview:</span>
                <span className="font-extrabold text-[#2563eb]">
                  {bmiPreview} ({bmiPreview < 18.5 ? "Underweight" : bmiPreview < 25 ? "Normal" : bmiPreview < 30 ? "Overweight" : "Obese"})
                </span>
              </div>
            )}

            <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#2563eb] text-white font-bold rounded-xl shadow-md">
                {dialogMode === "create" ? "Add Profile" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ABDM Flows */}
      {abdmProfileId && (
        <>
          <AbdmFlowDialog
            isOpen={abdmFlowOpen}
            onOpenChange={setAbdmFlowOpen}
            profileId={abdmProfileId}
            profileName={abdmProfileName}
            onSuccess={loadProfiles}
          />
          <AbdmCardDialog
            isOpen={abdmCardOpen}
            onOpenChange={setAbdmCardOpen}
            profileId={abdmProfileId}
            profileName={abdmProfileName}
            onSuccess={loadProfiles}
          />
        </>
      )}

    </div>
  );
};

export default Profiles;
