import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "green" | "blue" | "yellow" | "red" | "purple";
  change?: string;
  sub?: string;
}

const colorMap = {
  green:  "bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20",
  blue:   "bg-[#0EA5E9]/10 text-[#0EA5E9] border-[#0EA5E9]/20",
  yellow: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
  red:    "bg-[#F43F5E]/10 text-[#F43F5E] border-[#F43F5E]/20",
  purple: "bg-[#A855F7]/10 text-[#A855F7] border-[#A855F7]/20",
};

export default function StatCard({ title, value, icon: Icon, color = "green", change, sub }: StatCardProps) {
  return (
    <div className="admin-card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span className={cn("text-xs font-semibold", change.startsWith("+") ? "text-[#25D366]" : "text-[#F43F5E]")}>
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#111B21]">{value}</p>
        <p className="text-xs text-[#667781] mt-0.5">{title}</p>
        {sub && <p className="text-[10px] text-[#667781] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
