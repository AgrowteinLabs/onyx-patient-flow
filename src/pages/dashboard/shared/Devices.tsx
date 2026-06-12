import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderIcon, Search, Cpu, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { listDevices } from "@/services/device.service";

interface Device {
  _id: string;
  name: string;
  deviceCode: string;
  organizationName?: string;
  status?: string;
}

const Devices = () => {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filtered, setFiltered] = useState<Device[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // =======================================
  // 🔄 Fetch Devices
  // =======================================
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const data = await listDevices();
      console.log("📡 Raw devices response:", data);

      const allDevices = Array.isArray(data?.devices)
        ? data.devices
        : Array.isArray(data)
        ? data
        : [];

      setDevices(allDevices);
      setFiltered(allDevices);
      toast({ title: "Devices loaded successfully" });
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // =======================================
  // 🔍 Search Filter
  // =======================================
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(devices);
    } else {
      setFiltered(
        devices.filter((d) =>
          d.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, devices]);

  // =======================================
  // 🧩 Render
  // =======================================
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cpu className="h-7 w-7 text-primary" />
            Devices
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all registered medical devices.
          </p>
        </div>

        <Button onClick={fetchDevices} variant="outline">
          <LoaderIcon className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Reload
        </Button>
      </div>

      {/* Search */}
      <div className="flex justify-end">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading devices...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No devices found
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Device Code</th>
                    <th className="text-left py-3 px-4 font-semibold">Organization</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr
                      key={d._id}
                      className="border-b hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{d.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{d.deviceCode}</td>
                      <td className="py-3 px-4">{d.organizationName || "—"}</td>
                      <td className="py-3 px-4">
                        {d.status === "Active" ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center text-yellow-600">
                            <XCircle className="h-4 w-4 mr-1" /> Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Devices;
