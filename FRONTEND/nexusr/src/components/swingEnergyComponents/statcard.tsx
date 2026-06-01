import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  description: string;
  value: string | number;
  unit?: string;
  period: string;
  icon: ReactNode;
  borderColor: string;
  bgColor: string;
}

export default function StatCard({
  title,
  description,
  value,
  unit,
  period,
  icon,
  borderColor,
  bgColor,
}: StatCardProps) {
  return (
    <div
      className={`p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-l-4 ${borderColor}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${bgColor}`}>{icon}</div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          {period}
        </span>
      </div>
      <p className="text-xs font-medium text-slate-500">{description}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <p className="text-2xl font-black text-slate-900">{value}</p>
        {unit && <span className="text-xs font-bold text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}