"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, MessageSquare, Send } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDateTime } from "@/lib/utils";

export default function SupportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ status: statusFilter });
    const res = await fetch(`/api/admin/support?${q}`);
    setData(await res.json());
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleUpdate = async () => {
    if (!selected) return;
    setActionLoading(true);
    await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_id: selected.id, status: newStatus||undefined, reply: reply||undefined }),
    });
    setReply(""); setNewStatus(""); setSelected(null); setActionLoading(false); fetch_();
  };

  const priorityBadge = (p: string) => {
    if (p === "urgent") return <span className="badge-danger">Urgent</span>;
    if (p === "high") return <span className="badge-warn">High</span>;
    if (p === "medium") return <span className="badge-blue">Medium</span>;
    return <span className="badge-muted">Low</span>;
  };

  const statusBadge = (s: string) => {
    if (s === "resolved" || s === "closed") return <span className="badge-jade">{s}</span>;
    if (s === "in_progress") return <span className="badge-blue">In Progress</span>;
    return <span className="badge-warn">Open</span>;
  };

  return (
    <div>
      <Topbar title="Support Tickets"  />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <select className="admin-input w-40" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); }}>
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <button onClick={fetch_} className="admin-btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4"/>Refresh</button>
          <span className="text-[#667781] text-sm ml-auto">{data.length} tickets</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E9EDEF]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9EDEF] bg-[#EDE8DE]">
                {["User", "Subject", "Priority", "Status", "Created", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667781]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-[#667781]">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-[#667781]">No tickets</td></tr>
              ) : data.map(row => (
                <tr key={row.id} className="border-b border-[#E9EDEF]/50 hover:bg-[#EDE8DE]/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[#111B21] text-xs font-medium">{row.user_name || "—"}</p>
                    <p className="text-[#667781] text-[10px]">{row.user_email}</p>
                  </td>
                  <td className="px-4 py-3 text-[#667781] text-xs max-w-[180px] truncate">{row.subject}</td>
                  <td className="px-4 py-3">{priorityBadge(row.priority)}</td>
                  <td className="px-4 py-3">{statusBadge(row.status)}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs">{fmtDateTime(row.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setSelected(row); setNewStatus(row.status); }}
                      className="px-2 py-1 rounded text-[10px] bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3"/>Respond
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white border border-[#E9EDEF] rounded-2xl p-6 w-full max-w-lg" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Ticket Response</h2>
              <button onClick={() => setSelected(null)} className="text-[#667781] hover:text-white text-xl">×</button>
            </div>
            <div className="bg-[#EDE8DE] rounded-xl p-4 mb-4">
              <p className="text-[#111B21] text-sm font-medium mb-1">{selected.subject}</p>
              <p className="text-[#667781] text-xs">{selected.description}</p>
              <p className="text-[#667781] text-[10px] mt-2">{selected.user_email} · {fmtDateTime(selected.created_at)}</p>
            </div>
            <div className="mb-3">
              <label className="text-[10px] text-[#667781] uppercase tracking-wider mb-1 block">Update Status</label>
              <select className="admin-input" value={newStatus} onChange={e=>setNewStatus(e.target.value)}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="text-[10px] text-[#667781] uppercase tracking-wider mb-1 block">Reply</label>
              <textarea className="admin-input resize-none" rows={4} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type your response…" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="admin-btn-secondary flex-1">Cancel</button>
              <button onClick={handleUpdate} disabled={actionLoading}
                className="admin-btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40">
                <Send className="w-4 h-4"/>{actionLoading ? "…" : "Send & Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
