import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { listAdminTickets, createTicket, Ticket } from "@/services/ticket.service";
import { listBookings, Booking } from "@/services/booking.service";
import { 
  Ticket as TicketIcon, 
  Plus, 
  RefreshCcw, 
  MessageSquare, 
  HelpCircle, 
  CheckCircle2
} from "lucide-react";

const Tickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  
  // Create Form State
  const [category, setCategory] = useState("payment");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [description, setDescription] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // View Resolution Details State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsList, bookingsList] = await Promise.all([
        listAdminTickets(),
        listBookings()
      ]);
      
      setTickets(ticketsList || []);
      
      // Filter bookings for the active profile to make list relevant
      const storedProfileId = localStorage.getItem("selectedProfileId");
      const filteredBookings = (bookingsList || []).filter(b => b.profileId === storedProfileId || !b.profileId);
      setBookings(filteredBookings);
      
      if (filteredBookings.length > 0) {
        setSelectedBookingId(filteredBookings[0]._id || filteredBookings[0].id || "");
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load support data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({ title: "Please enter ticket description", variant: "destructive" });
      return;
    }

    let bookingId = selectedBookingId;
    if (!bookingId) {
      if (bookings.length > 0) {
        bookingId = bookings[0]._id || bookings[0].id || "";
      } else {
        // Fallback dummy Mongo ID if user has no appointments yet
        bookingId = "60d5ec4b1234567890abcdef";
      }
    }

    try {
      setSubmitLoading(true);
      await createTicket({
        bookingId,
        issueType: category,
        description
      });

      toast({
        title: "Ticket Raised!",
        description: "Your support request has been registered. Our helpdesk will review it soon."
      });
      setOpenCreateModal(false);
      setDescription("");
      loadData();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to raise support ticket", variant: "destructive" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'resolved':
        return <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px]">Resolved</Badge>;
      case 'in progress':
      case 'in-progress':
        return <Badge className="bg-amber-50 text-amber-600 border-none font-bold text-[9px]">In Progress</Badge>;
      default:
        return <Badge className="bg-sky-50 text-[#0ea5e9] border-none font-bold text-[9px]">Open</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <TicketIcon className="h-8 w-8 text-[#2563eb]" /> Support & Helpdesk
          </h1>
          <p className="text-slate-500 text-sm mt-1">Submit tickets for appointment issues, medical records, or billing concerns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadData} disabled={loading} className="rounded-full">
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setOpenCreateModal(true)} className="bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] text-white rounded-full font-bold shadow-md">
            <Plus className="h-4 w-4 mr-2" /> Raise Support Ticket
          </Button>
        </div>
      </div>

      {/* Main timeline of tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: History ticket listing */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-slate-800">Support Ticket Logs</CardTitle>
              <CardDescription className="text-xs text-slate-400">List of issues submitted to hospital staff</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                  <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">No support tickets registered</p>
                  <Button onClick={() => setOpenCreateModal(true)} size="sm" className="mt-3 bg-[#2563eb]">Submit Ticket</Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <div key={t._id || t.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <MessageSquare className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-slate-800 text-xs capitalize flex items-center gap-2">
                            {t.category} Category
                            {getStatusBadge(t.status)}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-semibold max-w-sm truncate">{t.description}</p>
                          <span className="text-[8.5px] text-slate-400 font-medium block">
                            Submitted on {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {t.status.toLowerCase() === 'resolved' && (
                        <Button 
                          onClick={() => {
                            setSelectedTicket(t);
                            setOpenDetailModal(true);
                          }}
                          variant="ghost" 
                          size="sm" 
                          className="text-[#2563eb] font-bold text-xs"
                        >
                          View Solution
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: FAQ panel info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border-slate-100 shadow-sm rounded-[20px]">
            <CardHeader>
              <CardTitle className="text-base font-extrabold text-slate-800">Frequently Asked</CardTitle>
              <CardDescription className="text-xs text-slate-400">Quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-600">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-700">How do I download lab reports?</h4>
                <p className="text-slate-500 font-medium leading-relaxed">Go to the Reports module, choose your active report card, and click the PDF button to open/download.</p>
              </div>
              <div className="space-y-1 pt-3 border-t">
                <h4 className="font-bold text-slate-700">Can I book for family members?</h4>
                <p className="text-slate-500 font-medium leading-relaxed">Yes. Simply switch the profile dropdown in the top header to choose the family patient file before booking.</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Raise Ticket Dialog */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="sm:max-w-md rounded-[20px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-xl flex items-center gap-2">
              <TicketIcon className="h-5 w-5 text-[#2563eb]" /> Submit Support Request
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Provide context details so that our clinical team can assist you efficiently.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4 mt-2">
            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-slate-700">Help Category *</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white h-10 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="payment">Billing & Payments</option>
                <option value="appointment">Appointment Rescheduling</option>
                <option value="records">Medical Records & Reports</option>
                <option value="technical">Technical Support</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>

            {/* Booking Selector */}
            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-slate-700">Select Related Appointment *</Label>
              {bookings.length === 0 ? (
                <p className="text-xs text-amber-500 font-medium bg-amber-50 p-2.5 rounded-lg border border-amber-100">No appointments found. A general reference will be used.</p>
              ) : (
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white h-10 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {bookings.map((b) => {
                    const docName = b.doctorId?.name || "Medical Expert";
                    const dateStr = (() => {
                      const d = new Date(b.slot || b.slotDate || "");
                      return isNaN(d.getTime()) ? "Scheduled Time" : d.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    })();
                    return (
                      <option key={b._id || b.id} value={b._id || b.id}>
                        {docName} — {dateStr}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-slate-700">Issue Description *</Label>
              <Textarea
                placeholder="Explain the problem you are experiencing..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="rounded-xl border border-slate-200 min-h-24 text-sm resize-none"
              />
            </div>

            <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpenCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#2563eb] text-white font-bold rounded-xl shadow-md"
                disabled={submitLoading || !description.trim()}
              >
                {submitLoading ? "Submitting..." : "Submit Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Resolution Details Dialog */}
      <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
        <DialogContent className="sm:max-w-md rounded-[20px] p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Resolution Action Notes
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Actions taken by clinical support staff to close this ticket request.
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4 mt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Submitted Case:</span>
                  <span className="font-semibold text-slate-800 capitalize">{selectedTicket.category} Issue</span>
                </div>
                <div className="flex flex-col gap-1 pt-1.5 border-t">
                  <span className="font-bold text-slate-500">Your Description:</span>
                  <p className="font-medium text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-100">{selectedTicket.description}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Helpdesk Resolution</Label>
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs font-semibold text-slate-700 leading-relaxed">
                  {selectedTicket.resolution || "This case was reviewed and corrected by the administration panel. Your records have been updated successfully."}
                </div>
              </div>

              <DialogFooter className="flex justify-end pt-4">
                <Button 
                  onClick={() => setOpenDetailModal(false)}
                  className="bg-[#2563eb] text-white font-bold rounded-xl shadow-md text-xs px-5"
                >
                  Close Detail
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Tickets;
