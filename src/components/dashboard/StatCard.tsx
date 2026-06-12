import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "secondary" | "success" | "warning";
}

const StatCard = ({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) => {
  const variantStyles = {
    default: "bg-white/80 backdrop-blur-md text-[#2d3748] shadow-sm border border-white/60",
    primary: "bg-gradient-to-r from-[#9b66c9] to-[#de6b9d] text-white shadow-md border-none",
    secondary: "bg-gradient-to-r from-[#a855f7] to-[#d946ef] text-white shadow-md border-none",
    success: "bg-gradient-to-r from-[#4ad099] to-[#3dbb89] text-white shadow-md border-none",
    warning: "bg-gradient-to-r from-[#fb923c] to-[#f97316] text-white shadow-md border-none",
  };

  return (
    <div className={cn("rounded-[24px] transition-all hover:scale-[1.02] p-5 flex items-center justify-between", variantStyles[variant])}>
       <div className="space-y-1">
          <p className="text-xs font-bold opacity-90 tracking-wide">{title}</p>
          <p className="text-3xl font-extrabold leading-none pb-1">{value}</p>
          <p className="text-[10px] font-bold opacity-80 flex items-center gap-1 uppercase tracking-wider">
            {trend ? (
              <>
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </>
            ) : (
              "↑ Active"
            )}
          </p>
       </div>
       <div className={cn(
          "h-10 w-10 rounded-[14px] flex items-center justify-center shrink-0",
          variant === "default" ? "bg-[#f4ebff] text-[#9b66c9]" : "bg-white/20 text-white"
        )}>
          <Icon className="h-5 w-5" />
       </div>
    </div>
  );
};

export default StatCard;
