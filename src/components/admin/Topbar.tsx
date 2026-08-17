"use client";
import { Search, Bell } from "lucide-react";

interface Props { title: string; adminEmail?: string; }

export default function Topbar({ title, adminEmail }: Props) {
  return (
    <header className="h-14 bg-white border-b border-[#E9EDEF] flex items-center px-6 gap-4 sticky top-0 z-10">
      <h1 className="text-base font-bold text-[#111B21] flex-1">{title}</h1>
      <div className="relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#667781]" />
        <input type="text" placeholder="Search…"
          className="pl-9 pr-4 py-1.5 rounded-lg border border-[#E9EDEF] bg-[#EDE8DE] text-sm text-[#111B21]
                     placeholder:text-[#667781] focus:outline-none focus:border-[#25D366]/50 w-48" />
      </div>
      <button className="w-8 h-8 rounded-lg bg-[#EDE8DE] flex items-center justify-center text-[#667781] hover:text-[#111B21] transition-colors">
        <Bell className="w-4 h-4" />
      </button>
      <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold">
          {adminEmail ? adminEmail[0].toUpperCase() : "A"}
        </span>
      </div>
    </header>
  );
}
