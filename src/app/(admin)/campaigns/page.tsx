"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDate, fmtNumber } from "@/lib/utils";

export default function CampaignsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ search, page: String(page) });
    const res = await fetch(`/api/admin/campaigns?${q}`);
    const d = await res.json();
    setData(d.data||[]); setTotal(d.total||0); setLoading(false);
  }, [search, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const statusBadge = (s: string) => {
    if (s === "sent" || s === "completed") return <span className="badge-jade">{s}</span>;
    if (s === "running" || s === "sending") return <span className="badge-blue">{s}</span>;
    if (s === "failed") return <span className="badge-danger">{s}</span>;
    if (s === "draft") return <span className="badge-muted">{s}</span>;
    return <span className="badge-warn">{s || "—"}</span>;
  };

  return (
    <div>
      <Topbar title="Campaigns"  />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#667781]" />
            <input className="admin-input pl-9" placeholder="Search campaigns…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button onClick={fetch_} className="admin-btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4"/>Refresh</button>
          <span className="text-[#667781] text-sm ml-auto">{total} campaigns</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E9EDEF]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9EDEF] bg-[#EDE8DE]">
                {["Name", "User", "Status", "Sent", "Delivered", "Failed", "Read", "Created"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667781]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-[#667781]">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-[#667781]">No campaigns</td></tr>
              ) : data.map(row => (
                <tr key={row.id} className="border-b border-[#E9EDEF]/50 hover:bg-[#EDE8DE]/40 transition-colors">
                  <td className="px-4 py-3 text-[#111B21] text-xs font-medium max-w-[180px] truncate">{row.name}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs truncate max-w-[120px]">{row.user?.email || "—"}</td>
                  <td className="px-4 py-3">{statusBadge(row.status)}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs">{fmtNumber(row.sent_count||0)}</td>
                  <td className="px-4 py-3 text-[#25D366] text-xs">{fmtNumber(row.delivered_count||0)}</td>
                  <td className="px-4 py-3 text-[#F43F5E] text-xs">{fmtNumber(row.failed_count||0)}</td>
                  <td className="px-4 py-3 text-[#0EA5E9] text-xs">{fmtNumber(row.read_count||0)}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs">{fmtDate(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[#667781] text-xs">Page {page}</p>
          <div className="flex gap-2">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="admin-btn-secondary text-xs disabled:opacity-40">Previous</button>
            <button disabled={page*25>=total} onClick={()=>setPage(p=>p+1)} className="admin-btn-secondary text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
