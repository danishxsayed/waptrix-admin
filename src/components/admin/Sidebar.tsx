"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, DollarSign, MessageSquare,
  FileText, Megaphone, BookUser, Zap, Inbox, Bell, HeadphonesIcon,
  Settings, ScrollText, LogOut, ChevronRight, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard",     href: "/dashboard",    icon: LayoutDashboard },
  { label: "Users",         href: "/users",         icon: Users },
  { label: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { label: "Payments",      href: "/payments",      icon: DollarSign },
  { label: "WhatsApp",      href: "/whatsapp",      icon: MessageSquare },
  { label: "Templates",     href: "/templates",     icon: FileText },
  { label: "Campaigns",     href: "/campaigns",     icon: Megaphone },
  { label: "Contacts",      href: "/contacts",      icon: BookUser },
  { label: "Automations",   href: "/automations",   icon: Zap },
  { label: "Messages",      href: "/messages",      icon: Inbox },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Support",       href: "/support",       icon: HeadphonesIcon },
  { label: "System",        href: "/settings",      icon: Settings },
  { label: "Audit Logs",    href: "/audit-logs",    icon: ScrollText },
];

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside className="w-60 bg-white border-r border-[#E9EDEF] flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#E9EDEF]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#25D366] rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-[#111B21] tracking-tight leading-none">Waptrix</p>
            <p className="text-[10px] text-[#667781] font-medium capitalize leading-tight mt-0.5">HQ · {role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 custom-scrollbar">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className={cn("nav-link", active && "nav-link-active")}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-[#E9EDEF] pt-3">
        <button onClick={logout}
          className="nav-link text-[#F43F5E] hover:bg-[#F43F5E]/10 hover:text-[#F43F5E]">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
