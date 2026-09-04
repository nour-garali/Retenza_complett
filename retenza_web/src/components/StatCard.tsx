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
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconBg = "bg-gray-100",
  iconColor = "text-gray-500",
  valueColor = "text-[#1B100C]"
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#EEE5DF] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow duration-300 flex flex-col justify-between h-full min-h-[110px]">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[12px] font-semibold text-[#9C8B82] uppercase tracking-wide leading-tight">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <h3 className={`text-[32px] font-medium leading-none mt-1 ${valueColor}`}>
          {value}
        </h3>
        <div className="text-[10px] text-slate-400 mt-1 font-semibold leading-tight">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
