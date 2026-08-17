"use client";
import { useEffect, useState } from "react";
import { Settings, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import Topbar from "@/components/admin/Topbar";

export default function SettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings").then(r=>r.json()).then(d=>{setConfig(d);setLoading(false);});
  }, []);

  const row = (label: string, value: string | boolean | undefined) => (
    <div key={label} className="flex items-center justify-between py-3 border-b border-[#E9EDEF] last:border-0">
      <span className="text-[#667781] text-sm">{label}</span>
      {typeof value === "boolean" ? (
        value
          ? <span className="badge-jade flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/>Configured</span>
          : <span className="badge-danger flex items-center gap-1"><XCircle className="w-3 h-3"/>Missing</span>
      ) : (
        <span className="text-[#111B21] text-sm font-mono">{value || "—"}</span>
      )}
    </div>
  );

  return (
    <div>
      <Topbar title="System Settings"  />
      <div className="p-6 space-y-6 max-w-2xl">
        <div className="admin-card">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-[#25D366]"/>Platform Configuration</h2>
          {loading ? <p className="text-[#667781] text-sm">Loading…</p> : (
            <div>
              {row("App URL", config.app_url)}
              {row("Supabase URL", config.supabase_url)}
              {row("Supabase Service Key", config.has_service_key)}
              {row("Admin JWT Secret", config.has_jwt_secret)}
              {row("Environment", config.node_env)}
            </div>
          )}
        </div>

        <div className="admin-card">
          <h2 className="text-sm font-bold text-white mb-4">Admin Accounts</h2>
          <p className="text-[#667781] text-sm mb-3">To create or modify admin accounts, use the Supabase SQL editor:</p>
          <div className="bg-[#EDE8DE] rounded-xl p-4 font-mono text-xs text-[#25D366] space-y-2">
            <p className="text-[#667781]">-- Create new admin</p>
            <p>INSERT INTO admin_users (email, password_hash, name, role)</p>
            <p>VALUES ('admin@example.com', '$2a$12$...', 'Name', 'admin');</p>
            <div className="mt-3 text-[#667781]">-- Generate hash: node -e "const b=require('bcryptjs');</div>
            <div>console.log(b.hashSync('Password123!',12))"</div>
          </div>
        </div>

        <div className="admin-card">
          <h2 className="text-sm font-bold text-white mb-4">Admin Roles & Permissions</h2>
          <div className="space-y-2">
            {[
              { role: "super_admin", desc: "Full access to everything. Can manage other admin accounts.", color: "badge-danger" },
              { role: "admin", desc: "Full access except creating/deleting super admins.", color: "badge-warn" },
              { role: "finance", desc: "Read access to payments, subscriptions, revenue.", color: "badge-blue" },
              { role: "support", desc: "Access to user management, support tickets, notifications.", color: "badge-jade" },
              { role: "operations", desc: "Access to campaigns, templates, automations, WhatsApp.", color: "badge-muted" },
            ].map(({ role, desc, color }) => (
              <div key={role} className="flex items-start gap-3 bg-[#EDE8DE] rounded-xl p-3">
                <span className={color}>{role}</span>
                <p className="text-[#667781] text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
