import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Video, Calendar } from "lucide-react";
import { useState } from "react";

const Consultancy = () => {
  const [doctors] = useState([
    { id: 1, name: "Dr. Emily Rodriguez", specialty: "Cardiology", availability: "Available Now", rating: 4.9, consultations: 245 },
    { id: 2, name: "Dr. James Wilson", specialty: "Neurology", availability: "Next: 2:00 PM", rating: 4.8, consultations: 189 },
    { id: 3, name: "Dr. Sarah Kim", specialty: "Pediatrics", availability: "Available Now", rating: 4.9, consultations: 312 },
    { id: 4, name: "Dr. Michael Chen", specialty: "Orthopedics", availability: "Next: Tomorrow", rating: 4.7, consultations: 156 },
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Doctor Consultancy</h1>
          <p className="text-muted-foreground mt-1">Connect with healthcare professionals</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doctor) => (
            <Card key={doctor.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{doctor.name}</CardTitle>
                    <Badge variant="outline" className="mt-2">{doctor.specialty}</Badge>
                  </div>
                  <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center">
                    <Stethoscope className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Availability</span>
                  <span className={`font-medium ${
                    doctor.availability.includes("Available") ? "text-success" : ""
                  }`}>
                    {doctor.availability}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-medium">⭐ {doctor.rating}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Consultations</span>
                  <span className="font-medium">{doctor.consultations}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 gradient-primary text-white">
                    <Video className="h-4 w-4 mr-2" />
                    Consult Now
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Consultancy;
