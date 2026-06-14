import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { listReportsByProfile } from "@/services/report.service";
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Filter, 
  RefreshCcw, 
  Share2, 
  User, 
  Cpu,
  Calendar
} from "lucide-react";

interface Report {
  _id: string;
  reportCode: string;
  s3Link: string;
  createdAt: string;
  profile: {
    _id: string;
    name: string;
    patientCode: string;
  };
  product?: {
    name: string;
    modelNo: string;
  };
  uploadedBy?: {
    name: string;
    role: string;
  };
}

const ReportsPage = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    localStorage.getItem("selectedProfileId")
  );

  // Dialog State
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);

  const loadReports = async () => {
    const profileId = localStorage.getItem("selectedProfileId");
    if (!profileId) return;

    try {
      setLoading(true);
      const data = await listReportsByProfile(profileId);
      setReports(data || []);
      setFilteredReports(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load reports", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Filter & Search Logic
  useEffect(() => {
    if (!search.trim()) {
      setFilteredReports(reports);
    } else {
      const q = search.toLowerCase();
      setFilteredReports(
        reports.filter(
          (r) =>
            (r.reportCode || "").toLowerCase().includes(q) ||
            (r.product?.name || "").toLowerCase().includes(q) ||
            (r.uploadedBy?.name || "").toLowerCase().includes(q)
        )
      );
    }
  }, [search, reports]);

  const handleDownload = (link: string) => {
    if (link) {
      window.open(link, "_blank");
      toast({ title: "Opening report link..." });
    } else {
      toast({ title: "No report link available", variant: "destructive" });
    }
  };

  const handleShare = (report: Report) => {
    if (navigator.share) {
      navigator.share({
        title: `Medical Report: ${report.reportCode}`,
        text: `Viewing medical records for patient ${report.profile?.name}`,
        url: report.s3Link
      }).catch(console.error);
    } else {
      // Fallback
      navigator.clipboard.writeText(report.s3Link || "");
      toast({ title: "Report link copied to clipboard!" });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-[#2563eb]" /> Medical Reports
          </h1>
          <p className="text-slate-500 text-sm mt-1">View, search, and download your clinical test results</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadReports} disabled={loading} className="rounded-full">
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search reports by code, doctor or device..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-slate-200 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 bg-white text-xs font-bold gap-2">
            <Filter className="h-4 w-4 text-slate-400" /> Date Range
          </Button>
        </div>
      </div>

      {/* Reports Listing */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-white rounded-[20px] shadow-sm animate-pulse border border-slate-100"></div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-200 bg-white">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-extrabold text-slate-700">No medical reports found</h3>
          <p className="text-slate-500 text-xs mt-1">There are no diagnostic reports registered under this profile.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <Card 
              key={report._id} 
              className="bg-white border border-slate-100 hover:border-[#0ea5e9] shadow-sm hover:shadow-md hover-lift transition-all rounded-[20px] overflow-hidden flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm tracking-wide truncate max-w-[150px]">
                        {report.reportCode || "Diagnostic Report"}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-bold block">
                        Uploaded {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 font-bold text-[8.5px] border-none px-2 py-0.5">
                    Ready
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs border-t pt-3">
                  <div className="flex justify-between text-slate-500">
                    <span>Uploaded By:</span>
                    <span className="font-semibold text-slate-700">{report.uploadedBy?.name || "Medical Lab Tech"}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Equipment:</span>
                    <span className="font-semibold text-slate-700">{report.product?.name || "Onyx ECG Pulse"}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button 
                    onClick={() => {
                      setSelectedReport(report);
                      setOpenDetailDialog(true);
                    }}
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs font-bold rounded-xl border-slate-200"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1 text-slate-400" /> Details
                  </Button>
                  <Button 
                    onClick={() => handleDownload(report.s3Link)}
                    size="sm" 
                    className="flex-1 text-xs font-bold bg-[#2563eb] text-white rounded-xl shadow-md"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> View PDF
                  </Button>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Report Details Dialog */}
      <Dialog open={openDetailDialog} onOpenChange={setOpenDetailDialog}>
        <DialogContent className="sm:max-w-md rounded-[20px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#2563eb]" /> Clinical Report Info
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Detailed metadata and download pathways for diagnostic report.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 mt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#2563eb]" />
                  <span className="font-bold">Patient Name:</span>
                  <span className="ml-auto font-medium text-slate-800">{selectedReport.profile?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[#2563eb]" />
                  <span className="font-bold">Device Name:</span>
                  <span className="ml-auto font-medium text-slate-800">
                    {selectedReport.product?.name || "Onyx Standard"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#2563eb]" />
                  <span className="font-bold">Upload Date:</span>
                  <span className="ml-auto font-medium text-slate-800">
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="rounded-xl text-xs font-bold gap-1"
                  onClick={() => handleShare(selectedReport)}
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </Button>
                <Button 
                  onClick={() => handleDownload(selectedReport.s3Link)}
                  className="bg-[#2563eb] text-white font-bold rounded-xl shadow-md text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> Download PDF
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ReportsPage;
