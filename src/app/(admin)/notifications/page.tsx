"use client";
import { useEffect, useState } from "react";
import { Bell, Send, RefreshCw } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDateTime } from "@/lib/utils";

export default function NotificationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info", target: "all", tenant_id: "" });
  const [msg, setMsg] = useState("");

  const fetch_ = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/notifications");
    setData(await res.json());
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);

  const send = async () => {
    if (!form.title || !form.message) return;
    setSending(true);
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setMsg("Notification sent!"); setForm({ title: "", message: "", type: "info", target: "all", tenant_id: "" }); fetch_(); }
    else { const d = await res.json(); setMsg(d.error || "Failed"); }
    setSending(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const typeBadge = (t: string) => {
    if (t === "success") return <span className="badge-jade">{t}</span>;
    if (t === "warning") return <span className="badge-warn">{t}</span>;
    if (t === "error") return <span className="badge-danger">{t}</span>;
    return <span className="badge-blue">{t}</span>;
  };

  return (
    <div>
      <Topbar title="Notifications"  />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send form */}
        <div className="admin-card space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2"><Bell className="w-4 h-4 text-[#25D366]"/>Send Notification</h2>
          <div>
            <label className="text-[10px] text-[#667781] uppercase tracking-wider mb-1 block">Title</label>
            <input className="admin-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Notification title" />
          </div>
          <div>
            <label className="text-[10px] text-[#667781] uppercase tracking-wider mb-1 block">Message</label>
            <textarea className="admin-input resize-none" rows={3} value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} placeholder="Notification message…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#667781] uppercase tracking-wider mb-1 block">Type</label>
              <select className="admin-input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#667781] uppercase tracking-wider mb-1 block">Target</label>
              <select className="admin-input" value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))}>
                <option value="all">All Users</option>
                <option value="user">Specific User</option>
              </select>
            </div>
          </div>
          {form.target === "user" && (
            <div>
              <label className="text-[10px] text-[#667781] uppercase tracking-wider mb-1 block">Tenant ID</label>
              <input className="admin-input" value={form.tenant_id} onChange={e=>setForm(f=>({...f,tenant_id:e.target.value}))} placeholder="User tenant UUID" />
            </div>
          )}
          {msg && <p className={`text-xs ${msg.includes("sent") ? "text-[#25D366]" : "text-[#F43F5E]"}`}>{msg}</p>}
          <button onClick={send} disabled={sending || !form.title || !form.message}
            className="admin-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40">
            <Send className="w-4 h-4"/>{sending ? "Sending…" : "Send Notification"}
          </button>
        </div>

        {/* History */}
        <div className="lg:col-span-2 admin-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Notification History</h2>
            <button onClick={fetch_} className="admin-btn-secondary text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3"/>Refresh</button>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
            {loading ? <p className="text-[#667781] text-sm">Loading…</p> :
              data.length === 0 ? <p className="text-[#667781] text-sm">No notifications sent yet</p> :
              data.map(n => (
                <div key={n.id} className="bg-[#EDE8DE] rounded-xl px-4 py-3 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {typeBadge(n.type)}
                      <span className="text-[10px] text-[#667781]">{n.target === "all" ? "All users" : "Specific user"}</span>
                    </div>
                    <p className="text-[#111B21] text-xs font-medium">{n.title}</p>
                    <p className="text-[#667781] text-xs mt-0.5">{n.message}</p>
                    <p className="text-[#667781] text-[10px] mt-1">By {n.admin?.name || "Admin"} · {fmtDateTime(n.created_at)}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
