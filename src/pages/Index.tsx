import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, Shield, Users, Stethoscope } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="mb-8 h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Activity className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Onyx Health+
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl">
            Advanced Healthcare Management Platform
          </p>

          <Button 
            size="lg"
            onClick={() => navigate("/login")}
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-xl"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <Shield className="h-8 w-8 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Secure & Compliant</h3>
              <p className="text-white/80 text-sm">
                HIPAA-compliant platform ensuring your data privacy
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <Users className="h-8 w-8 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Role-Based Access</h3>
              <p className="text-white/80 text-sm">
                7 specialized dashboards for different healthcare roles
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <Stethoscope className="h-8 w-8 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Complete Care</h3>
              <p className="text-white/80 text-sm">
                From consultations to prescriptions, all in one place
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
