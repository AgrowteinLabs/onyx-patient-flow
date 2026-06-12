import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, FileText, Download, Activity, Eye, Calendar, ArrowLeft, Image, Play, Volume2, HelpCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { 
  listSessions, 
  viewSession, 
  getSessionItems, 
  getSessionItemViewUrls, 
  getSessionItemMediaList,
  Session 
} from "@/services/session.service";
import { listReportsBySession } from "@/services/report.service";

const Sessions = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected Session States
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [sessionItems, setSessionItems] = useState<any[]>([]);
  const [sessionReports, setSessionReports] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Selected Item Media States
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [itemMedia, setItemMedia] = useState<any[]>([]);
  const [itemViewUrls, setItemViewUrls] = useState<Record<string, string>>({});
  const [loadingItemMedia, setLoadingItemMedia] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await listSessions();
      setSessions(data || []);
      // If we have sessions, select the first one by default if none selected
      if (data && data.length > 0 && !selectedSessionId) {
        handleViewDetails(data[0].id || data[0]._id);
      }
    } catch (error: any) {
      toast({
        title: "Failed to fetch sessions",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setLoadingDetails(true);
    setSelectedItem(null);
    setItemMedia([]);
    setItemViewUrls({});
    try {
      const [sessionData, itemsData, reportsData] = await Promise.all([
        viewSession(sessionId),
        getSessionItems(sessionId),
        listReportsBySession(sessionId)
      ]);
      setSelectedSession(sessionData);
      setSessionItems(itemsData || []);
      setSessionReports(reportsData || []);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Failed to load session details",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewItemMedia = async (item: any) => {
    setSelectedItem(item);
    setLoadingItemMedia(true);
    setItemMedia([]);
    setItemViewUrls({});
    try {
      const itemId = item._id || item.id;
      const [mediaData, urlsData] = await Promise.all([
        getSessionItemMediaList(itemId),
        getSessionItemViewUrls(itemId)
      ]);
      setItemMedia(mediaData || []);
      setItemViewUrls(urlsData?.urls || {});
    } catch (err: any) {
      console.error("Failed to load item media:", err);
      toast({
        title: "No media available",
        description: "Failed to fetch attachments for this test.",
      });
    } finally {
      setLoadingItemMedia(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const downloadReport = (url: string) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  const getMediaIcon = (fieldName: string) => {
    if (fieldName.toLowerCase().includes("image")) return Image;
    if (fieldName.toLowerCase().includes("audio") || fieldName.toLowerCase().includes("sound")) return Volume2;
    if (fieldName.toLowerCase().includes("video")) return Play;
    return HelpCircle;
  };

  const renderSessionsList = () => {
    if (loading && sessions.length === 0) {
      return (
        <div className="p-6 text-center text-muted-foreground">Loading sessions...</div>
      );
    }

    if (sessions.length === 0) {
      return (
        <div className="p-6 text-center text-muted-foreground">No sessions found.</div>
      );
    }

    return (
      <div className="divide-y max-h-[600px] overflow-y-auto custom-scrollbar">
        {sessions.map((session) => {
          const sessionId = session.id || session._id;
          const isSelected = selectedSessionId === sessionId;
          return (
            <div
              key={sessionId}
              className={`p-4 cursor-pointer transition-all flex items-center justify-between ${
                isSelected 
                  ? "bg-primary/10 border-l-4 border-primary" 
                  : "hover:bg-muted/40"
              }`}
              onClick={() => handleViewDetails(sessionId)}
            >
              <div className="space-y-1">
                <p className="font-semibold text-sm tracking-wide">
                  Session: {sessionId.substring(0, 10)}...
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(session.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={session.status === "Completed" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-blue-100 text-blue-800 hover:bg-blue-200"}>
                  {session.status || "Completed"}
                </Badge>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDetailsPanel = () => {
    if (!selectedSessionId) {
      return (
        <Card className="h-full flex items-center justify-center p-10 border-dashed">
          <div className="text-center space-y-2">
            <Activity className="h-10 w-10 text-muted-foreground mx-auto animate-pulse" />
            <p className="text-muted-foreground text-sm">Select a session on the left to explore test observations.</p>
          </div>
        </Card>
      );
    }

    if (loadingDetails) {
      return (
        <Card className="p-10 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Loading session details...</p>
        </Card>
      );
    }

    if (!selectedSession) {
      return null;
    }

    return (
      <div className="space-y-6">
        {/* Session Summary Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-xl">Checkup Details</CardTitle>
              <CardDescription>
                Conducted on {new Date(selectedSession.createdAt).toLocaleString()}
              </CardDescription>
            </div>
            <Badge variant="secondary" className={selectedSession.status === "Completed" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-blue-100 text-blue-800 hover:bg-blue-200"}>
              {selectedSession.status || "Completed"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-lg">
              <div>
                <span className="text-muted-foreground block text-xs">Device Name</span>
                <span className="font-semibold">{selectedSession.productId?.name || "Onyx Device"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Model No</span>
                <span className="font-semibold">{selectedSession.productId?.modelNo || "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Reports Section */}
        {sessionReports.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Generated Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sessionReports.map((report) => (
                <div key={report._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                  <div>
                    <p className="font-medium text-sm">{report.reportCode || "Health Report"}</p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => downloadReport(report.s3Link)}
                    disabled={!report.s3Link}
                  >
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Session Items (Tests) Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Tests & Measurements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sessionItems.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">No test measurements available for this session.</p>
            ) : (
              <div className="divide-y">
                {sessionItems.map((item) => {
                  const testName = item.testId?.name || "Test Result";
                  const testKey = item.testId?.appTestKey || "";
                  const isItemSelected = selectedItem?._id === item._id || selectedItem?.id === item._id;
                  return (
                    <div key={item._id || item.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm tracking-wide text-[#2d3748]">{testName}</h4>
                          {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-white font-mono text-sm px-2.5 py-1">
                            {typeof item.result === 'object' && item.result !== null
                              ? JSON.stringify(item.result)
                              : String(item.result || "N/A")}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant={isItemSelected ? "default" : "outline"}
                            onClick={() => handleViewItemMedia(item)}
                          >
                            Attachments
                          </Button>
                        </div>
                      </div>

                      {/* Media/Attachments Preview Box for Selected Item */}
                      {isItemSelected && (
                        <div className="mt-3 p-4 bg-muted/30 rounded-lg border border-dashed border-gray-300">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                            Observation Attachments
                          </h5>
                          
                          {loadingItemMedia ? (
                            <p className="text-xs text-muted-foreground animate-pulse">Loading attachments...</p>
                          ) : Object.keys(itemViewUrls).length === 0 ? (
                            <p className="text-xs text-muted-foreground">No attachment links available for this test item.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(itemViewUrls).map(([key, url]) => {
                                const Icon = getMediaIcon(key);
                                const isImage = key.toLowerCase().includes("image");
                                return (
                                  <div key={key} className="flex flex-col gap-2 p-2 bg-white rounded-lg border shadow-sm">
                                    {isImage ? (
                                      <img 
                                        src={url} 
                                        alt={key} 
                                        className="w-full h-32 object-contain bg-black/5 rounded-md" 
                                        onClick={() => window.open(url, "_blank")}
                                      />
                                    ) : (
                                      <div className="h-32 flex items-center justify-center bg-black/5 rounded-md">
                                        <Icon className="h-10 w-10 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between text-xs px-1">
                                      <span className="font-semibold text-gray-600 truncate max-w-[120px]">{key}</span>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-7 w-7"
                                        onClick={() => window.open(url, "_blank")}
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Health Sessions</h1>
          <p className="text-muted-foreground mt-1">Explore your diagnostic history and test data</p>
        </div>
        <Button variant="outline" onClick={fetchSessions} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* SPLIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sessions List */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Checkup History</CardTitle>
              <CardDescription>Select a checkup to view details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {renderSessionsList()}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Session Details Panel */}
        <div className="lg:col-span-7 space-y-6">
          {renderDetailsPanel()}
        </div>
      </div>
    </div>
  );
};

const SessionsPage = () => {
  return (
    <DashboardLayout>
      <Sessions />
    </DashboardLayout>
  );
};

export default SessionsPage;
