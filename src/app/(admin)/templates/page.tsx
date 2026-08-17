"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDate } from "@/lib/utils";

export default function TemplatesPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ search, status: statusFilter, page: String(page) });
    const res = await fetch(`/api/admin/templates?${q}`);
    const d = await res.json();
    setData(d.data||[]); setTotal(d.total||0); setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const statusBadge = (s: string) => {
    if (s === "APPROVED" || s === "approved") return <span className="badge-jade">Approved</span>;
    if (s === "PENDING" || s === "pending") return <span className="badge-warn">Pending</span>;
    if (s === "REJECTED" || s === "rejected") return <span className="badge-danger">Rejected</span>;
    return <span className="badge-muted">{s || "—"}</span>;
  };

  return (
    <div>
      <Topbar title="Templates"  />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#667781]" />
            <input className="admin-input pl-9" placeholder="Search templates…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="admin-input w-36" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button onClick={fetch_} className="admin-btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4"/>Refresh</button>
          <span className="text-[#667781] text-sm ml-auto">{total} templates</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E9EDEF]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9EDEF] bg-[#EDE8DE]">
                {["Name", "User", "Category", "Language", "Status", "Created"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667781]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-[#667781]">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-[#667781]">No templates</td></tr>
              ) : data.map(row => (
                <tr key={row.id} className="border-b border-[#E9EDEF]/50 hover:bg-[#EDE8DE]/40 transition-colors">
                  <td className="px-4 py-3 text-[#111B21] text-xs font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs">{row.user?.email || "—"}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs capitalize">{row.category || "—"}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs uppercase">{row.language || "—"}</td>
                  <td className="px-4 py-3">{statusBadge(row.meta_status)}</td>
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
