import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Shield,
  Users,
  Stethoscope,
  Heart,
  ShieldCheck,
  Building2,
  UserCheck,
  HeartPulse,
  Wrench,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div
      className="h-screen w-full flex flex-col justify-between relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #FFF5F6 0%, #FFE8EB 50%, #FFF7F8 100%)",
      }}
    >
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[45vw] h-[45vw] rounded-full bg-[#F2052C]/4 blur-3xl translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-[35vw] h-[35vw] rounded-full bg-[#35B7C9]/4 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-pink-300/10 blur-3xl pointer-events-none"></div>

      {/* Navbar Header */}
      <header className="w-full max-w-7xl mx-auto px-8 py-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center">
          <img
            src="/ONYXHPLOGO.png"
            alt="Onyx Health+"
            className="h-9 w-auto object-contain"
          />
        </div>
        <Button
          onClick={() => navigate("/login")}
          className="border border-white/60 bg-white/70 backdrop-blur-sm text-[#14213D] hover:bg-white/90 rounded-[14px] shadow-sm font-extrabold text-xs uppercase tracking-wider px-5 h-9"
        >
          Portal Login
        </Button>
      </header>

      {/* Main Hero & Content Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 flex flex-col justify-center gap-4 z-10 overflow-hidden">
        
        {/* Top Section: Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
          
          {/* Left Side: Marketing Info */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left space-y-4">
            
            {/* Badge */}
            <div className="flex justify-start">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-extrabold border uppercase tracking-wider bg-white/80 border-[#FFE8EB] text-[#F2052C] shadow-sm"
              >
                <Heart className="h-3 w-3 fill-[#F2052C] animate-pulse" />
                Next-Gen Medical ERP
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#14213D] leading-none tracking-tight">
              Smart Health <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F2052C] to-[#FF4B66]">
                Administration
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-500 font-semibold leading-relaxed max-w-md">
              Onyx Health+ brings role-based operational intelligence, live device telemetry, and simplified patient flows into a unified, secure medical portal.
            </p>

            <div className="pt-2">
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-[#F2052C] to-[#FF4B66] text-white border-none shadow-md shadow-[#F2052C]/25 hover:opacity-90 rounded-[16px] px-7 h-11 text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 group"
              >
                Enter Portal
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Right Side: Circular Role Constellation Canvas */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end w-full">
            <div 
              className="w-[380px] h-[380px] rounded-[32px] bg-[#14213D] shadow-2xl relative overflow-hidden flex items-center justify-center"
              style={{
                boxShadow: "0 25px 60px rgba(20,33,61,0.25)",
              }}
            >
              {/* Background Glow Blobs Inside Panel */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#35B7C9]/10 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[#F2052C]/8 blur-2xl" />
              
              {/* Connected Mesh SVG Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" viewBox="0 0 380 380">
                <line x1="190" y1="190" x2="190" y2="40" stroke="white" strokeWidth="1.2" strokeDasharray="3 3" />
                <line x1="190" y1="190" x2="310" y2="105" stroke="white" strokeWidth="1.2" strokeDasharray="3 3" />
                <line x1="190" y1="190" x2="310" y2="275" stroke="white" strokeWidth="1.2" strokeDasharray="3 3" />
                <line x1="190" y1="190" x2="190" y2="340" stroke="white" strokeWidth="1.2" strokeDasharray="3 3" />
                <line x1="190" y1="190" x2="70" y2="275" stroke="white" strokeWidth="1.2" strokeDasharray="3 3" />
                <line x1="190" y1="190" x2="70" y2="105" stroke="white" strokeWidth="1.2" strokeDasharray="3 3" />
              </svg>

              {/* CENTER CORE NODE */}
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#F2052C] to-[#FF4B66] text-white flex items-center justify-center shadow-lg animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <Heart className="h-7 w-7 text-white fill-white" />
              </div>

              {/* FLOATING SURROUNDING ROLE NODES */}
              
              {/* Node 1: Super Admin (Top) */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer z-10">
                <div className="h-11 w-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition-all hover:scale-110 duration-300 shadow-md group-hover:border-red-400">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -bottom-4 text-[7px] font-extrabold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Admin</span>
              </div>

              {/* Node 2: Executive (Top Right) */}
              <div className="absolute top-20 right-8 flex flex-col items-center group cursor-pointer z-10">
                <div className="h-11 w-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition-all hover:scale-110 duration-300 shadow-md group-hover:border-[#35B7C9]">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -bottom-4 text-[7px] font-extrabold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Executive</span>
              </div>

              {/* Node 3: Cluster Head (Bottom Right) */}
              <div className="absolute bottom-20 right-8 flex flex-col items-center group cursor-pointer z-10">
                <div className="h-11 w-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition-all hover:scale-110 duration-300 shadow-md group-hover:border-emerald-400">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -bottom-4 text-[7px] font-extrabold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Cluster</span>
              </div>

              {/* Node 4: User Head (Bottom) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer z-10">
                <div className="h-11 w-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition-all hover:scale-110 duration-300 shadow-md group-hover:border-violet-400">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -bottom-4 text-[7px] font-extrabold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">User Head</span>
              </div>

              {/* Node 5: Doctor (Bottom Left) */}
              <div className="absolute bottom-20 left-8 flex flex-col items-center group cursor-pointer z-10">
                <div className="h-11 w-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition-all hover:scale-110 duration-300 shadow-md group-hover:border-amber-400">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -bottom-4 text-[7px] font-extrabold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Doctor</span>
              </div>

              {/* Node 6: Nurse & Tech (Top Left) */}
              <div className="absolute top-20 left-8 flex flex-col items-center group cursor-pointer z-10">
                <div className="h-11 w-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition-all hover:scale-110 duration-300 shadow-md group-hover:border-pink-400">
                  <HeartPulse className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -bottom-4 text-[7px] font-extrabold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Clinics</span>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Section: Compact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-6 shrink-0">
          {/* Card 1 */}
          <Card className="border-none bg-white/60 backdrop-blur-md rounded-[20px] shadow-sm p-5 hover-lift flex gap-4">
            <div className="h-10 w-10 rounded-[12px] bg-[#F2052C]/10 flex items-center justify-center text-[#F2052C] shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#14213D] mb-1">Secure & Compliant</h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Full HIPAA compliance protecting patient health information.
              </p>
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="border-none bg-white/60 backdrop-blur-md rounded-[20px] shadow-sm p-5 hover-lift flex gap-4">
            <div className="h-10 w-10 rounded-[12px] bg-[#35B7C9]/12 flex items-center justify-center text-[#35B7C9] shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#14213D] mb-1">Role-Based Access</h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                7 tailored layout portals built specifically for medical tasks.
              </p>
            </div>
          </Card>

          {/* Card 3 */}
          <Card className="border-none bg-white/60 backdrop-blur-md rounded-[20px] shadow-sm p-5 hover-lift flex gap-4">
            <div className="h-10 w-10 rounded-[12px] bg-violet-100 text-violet-600 shrink-0 flex items-center justify-center">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#14213D] mb-1">Complete Care</h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Consolidated workflows connecting patients to virtual prescriptions.
              </p>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-3.5 text-[9px] text-slate-400 font-bold border-t border-slate-100/40 relative z-10 bg-white/10 shrink-0">
        © 2026 ONYX HEALTH+. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
