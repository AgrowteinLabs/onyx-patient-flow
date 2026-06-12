// import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Search, Download, RefreshCw } from "lucide-react";
import { useState } from "react";

const Payments = () => {
  const [payments] = useState([
    {
      id: 1,
      invoice: "INV-2025-001",
      amount: "$450.00",
      date: "2025-01-15",
      method: "Credit Card",
      status: "Paid",
    },
    {
      id: 2,
      invoice: "INV-2025-002",
      amount: "$325.00",
      date: "2025-01-14",
      method: "Insurance",
      status: "Pending",
    },
    {
      id: 3,
      invoice: "INV-2025-003",
      amount: "$180.00",
      date: "2025-01-13",
      method: "Cash",
      status: "Paid",
    },
    {
      id: 4,
      invoice: "INV-2025-004",
      amount: "$550.00",
      date: "2025-01-12",
      method: "Debit Card",
      status: "Refunded",
    },
  ]);

  return (
    // <DashboardLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage payments
          </p>
        </div>
        <Button className="gradient-primary text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Payment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment History</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search payments..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Invoice</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Method</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">{payment.invoice}</td>
                    <td className="py-3 px-4 font-semibold">
                      {payment.amount}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {payment.date}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{payment.method}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === "Paid"
                            ? "bg-success/10 text-success"
                            : payment.status === "Pending"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                        {payment.status === "Paid" && (
                          <Button variant="ghost" size="icon">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
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

export default Payments;
