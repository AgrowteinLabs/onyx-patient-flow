import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Pill, 
  Download, 
  AlertCircle,
  FileCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Prescription {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedBy: string;
  date: string;
  refillsLeft: number;
  notes?: string;
  status: "active" | "completed";
}

const Prescriptions = () => {
  const { toast } = useToast();
  
  // Mock data representing items from session items
  const [prescriptions] = useState<Prescription[]>([
    {
      id: "rx-1",
      medicineName: "Amoxicillin 500mg",
      dosage: "1 capsule",
      frequency: "Three times daily",
      duration: "7 Days",
      prescribedBy: "Dr. Sarah Jenkins",
      date: "2026-06-12",
      refillsLeft: 0,
      notes: "Take with food. Complete the entire course even if symptoms disappear.",
      status: "active"
    },
    {
      id: "rx-2",
      medicineName: "Lisinopril 10mg",
      dosage: "1 tablet",
      frequency: "Once daily (Morning)",
      duration: "30 Days",
      prescribedBy: "Dr. Robert Chen",
      date: "2026-06-10",
      refillsLeft: 2,
      notes: "Avoid potassium supplements unless advised by doctor. Monitor blood pressure.",
      status: "active"
    },
    {
      id: "rx-3",
      medicineName: "Metformin 850mg",
      dosage: "1 tablet",
      frequency: "Twice daily with meals",
      duration: "90 Days",
      prescribedBy: "Dr. Sarah Jenkins",
      date: "2026-03-15",
      refillsLeft: 1,
      notes: "Take with breakfast and dinner. Stay well hydrated.",
      status: "completed"
    }
  ]);

  const handleDownload = (p: Prescription) => {
    toast({
      title: "Downloading Prescription",
      description: `Saving PDF for ${p.medicineName}...`
    });
  };

  const active = prescriptions.filter(p => p.status === "active");
  const past = prescriptions.filter(p => p.status === "completed");

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Pill className="h-8 w-8 text-[#2563eb]" /> Prescriptions
        </h1>
        <p className="text-slate-500 text-sm mt-1">Track your active medications, dosages, and refill history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Active Prescriptions list */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-slate-800">Current Medications</CardTitle>
              <CardDescription className="text-xs text-slate-400">Medications currently active and prescribed for ongoing treatment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {active.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No active prescriptions found</p>
              ) : (
                <div className="space-y-4">
                  {active.map((p) => (
                    <div key={p.id} className="p-5 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-4">
                      
                      {/* Med info */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="h-10 w-10 rounded-xl bg-rose-50 text-[#f2052c] flex items-center justify-center shrink-0">
                            <Pill className="h-5.5 w-5.5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">{p.medicineName}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge className="bg-slate-200 text-slate-600 border-none font-bold text-[8px] px-1.5 py-0.5">
                                {p.duration}
                              </Badge>
                              <span className="text-[9px] text-slate-400 font-medium">Prescribed on {new Date(p.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleDownload(p)}
                          variant="outline" 
                          size="sm" 
                          className="text-xs font-bold rounded-xl border-slate-200 bg-white"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" /> PDF
                        </Button>
                      </div>

                      {/* Dosage schedule details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-100 text-xs text-slate-600">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium">Dosage</span>
                          <span className="font-extrabold text-slate-700">{p.dosage}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium">Frequency</span>
                          <span className="font-extrabold text-slate-700">{p.frequency}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-medium">Refills Left</span>
                          <span className="font-extrabold text-slate-700">{p.refillsLeft} refills</span>
                        </div>
                      </div>

                      {/* Notes warning */}
                      {p.notes && (
                        <div className="flex items-start gap-2 text-[10px] text-amber-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed font-semibold">{p.notes}</span>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: History prescriptions */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-slate-800">History & Archive</CardTitle>
              <CardDescription className="text-xs text-slate-400">Past medications and finished prescription courses</CardDescription>
            </CardHeader>
            <CardContent>
              {past.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No past prescriptions recorded</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {past.map((p) => (
                    <div key={p.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                          <FileCheck className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs truncate max-w-[120px]">{p.medicineName}</h4>
                          <span className="text-[9px] text-slate-400 font-medium block">Ended {new Date(p.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge className="bg-slate-100 text-slate-500 font-bold border-none text-[8.5px] px-2 py-0.5">
                        Completed
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
};

export default Prescriptions;
