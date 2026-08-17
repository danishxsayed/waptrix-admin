"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDateTime } from "@/lib/utils";

export default function MessagesPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ status: statusFilter, page: String(page) });
    const res = await fetch(`/api/admin/messages?${q}`);
    const d = await res.json();
    setData(d.data||[]); setTotal(d.total||0); setLoading(false);
  }, [statusFilter, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const statusBadge = (s: string) => {
    if (s === "delivered" || s === "read") return <span className="badge-jade">{s}</span>;
    if (s === "sent") return <span className="badge-blue">{s}</span>;
    if (s === "failed") return <span className="badge-danger">{s}</span>;
    return <span className="badge-muted">{s||"—"}</span>;
  };

  return (
    <div>
      <Topbar title="Message Monitoring"  />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <select className="admin-input w-40" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="read">Read</option>
            <option value="failed">Failed</option>
          </select>
          <button onClick={fetch_} className="admin-btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4"/>Refresh</button>
          <span className="text-[#667781] text-sm ml-auto">{total} logs</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E9EDEF]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9EDEF] bg-[#EDE8DE]">
                {["To", "Tenant", "Status", "Error", "Sent At", "Delivered At"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667781]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-[#667781]">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-[#667781]">No message logs</td></tr>
              ) : data.map(row => (
                <tr key={row.id} className="border-b border-[#E9EDEF]/50 hover:bg-[#EDE8DE]/20 transition-colors">
                  <td className="px-4 py-3 text-[#667781] text-xs font-mono">{row.to_phone||"—"}</td>
                  <td className="px-4 py-3 text-[#667781] text-[10px] font-mono">{row.tenant_id?.slice(0,8)}…</td>
                  <td className="px-4 py-3">{statusBadge(row.status)}</td>
                  <td className="px-4 py-3 text-[#F43F5E] text-[10px] max-w-[150px] truncate">{row.error_message||"—"}</td>
                  <td className="px-4 py-3 text-[#667781] text-[10px]">{fmtDateTime(row.sent_at||row.created_at)}</td>
                  <td className="px-4 py-3 text-[#667781] text-[10px]">{fmtDateTime(row.delivered_at)||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[#667781] text-xs">Page {page}</p>
          <div className="flex gap-2">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="admin-btn-secondary text-xs disabled:opacity-40">Previous</button>
            <button disabled={page*50>=total} onClick={()=>setPage(p=>p+1)} className="admin-btn-secondary text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
