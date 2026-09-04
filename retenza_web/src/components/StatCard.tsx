import React from "react";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle: React.ReactNode;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  valueColor?: string;
  compact?: boolean;
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconBg = "bg-gray-100",
  iconColor = "text-gray-500",
  valueColor = "text-[#1B100C]",
  compact = false
}: StatCardProps) {
  const paddingClass = compact ? "p-4" : "p-5";
  const titleClass = compact ? "text-[10px]" : "text-[12px]";
  const valueClass = compact ? "text-[26px]" : "text-[32px]";
  const iconWrapperClass = compact ? "w-8 h-8" : "w-9 h-9";
  const iconClass = compact ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className={`bg-white rounded-2xl ${paddingClass} border border-[#EEE5DF] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow duration-300 flex flex-col justify-between h-full min-h-[110px]`}>
      <div className="flex justify-between items-start mb-3 gap-2">
        <span className={`${titleClass} font-semibold text-[#9C8B82] uppercase tracking-wide leading-tight`}>
          {title}
        </span>
        <div className={`${iconWrapperClass} rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          <Icon className={iconClass} />
        </div>
      </div>
      <div>
        <h3 className={`${valueClass} font-medium leading-none mt-1 ${valueColor}`}>
          {value}
        </h3>
        <div className="text-[10px] text-slate-400 mt-1.5 font-semibold leading-tight">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
