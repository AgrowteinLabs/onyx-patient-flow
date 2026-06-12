// import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Settings as SettingsIcon,
} from "lucide-react";

const Organization = () => {
  const orgData = {
    name: "City Central Hospital",
    address: "123 Medical Plaza, New York, NY 10001",
    phone: "+1 (555) 123-4567",
    email: "contact@citycentral.com",
    totalStaff: 245,
    departments: 12,
    established: "1985",
  };

  return (
    // <DashboardLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organization</h1>
          <p className="text-muted-foreground mt-1">
            View organization details
          </p>
        </div>
        <Button className="gradient-primary text-white">
          <SettingsIcon className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Organization Name
                </p>
                <p className="font-medium">{orgData.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{orgData.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{orgData.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{orgData.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">Total Staff</span>
              </div>
              <span className="text-2xl font-bold">{orgData.totalStaff}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-medium">Departments</span>
              </div>
              <span className="text-2xl font-bold">{orgData.departments}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <SettingsIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">Established</span>
              </div>
              <span className="text-2xl font-bold">{orgData.established}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    // {/* </DashboardLayout> */}
  );
};

export default Organization;
