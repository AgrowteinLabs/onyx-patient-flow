// import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Download, Eye } from "lucide-react";
import { useState } from "react";

const Reports = () => {
  const [reports] = useState([
    {
      id: 1,
      patient: "John Smith",
      type: "Blood Test",
      date: "2025-01-15",
      status: "Completed",
      doctor: "Dr. Emily Rodriguez",
    },
    {
      id: 2,
      patient: "Sarah Johnson",
      type: "X-Ray",
      date: "2025-01-15",
      status: "Pending Review",
      doctor: "Dr. James Wilson",
    },
    {
      id: 3,
      patient: "Michael Chen",
      type: "ECG",
      date: "2025-01-14",
      status: "Completed",
      doctor: "Dr. Sarah Kim",
    },
    {
      id: 4,
      patient: "Emma Davis",
      type: "MRI Scan",
      date: "2025-01-14",
      status: "Processing",
      doctor: "Dr. Michael Chen",
    },
  ]);

  return (
    // <DashboardLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">
            View and manage medical reports
          </p>
        </div>
        <Button className="gradient-primary text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Reports</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search reports..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Report Type
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Doctor</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">{report.patient}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{report.type}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {report.date}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {report.doctor}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          report.status === "Completed"
                            ? "bg-success/10 text-success"
                            : report.status === "Processing"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
    // </DashboardLayout>
  );
};

export default Reports;
