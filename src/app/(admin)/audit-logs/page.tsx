"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, ScrollText } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDateTime } from "@/lib/utils";

export default function AuditLogsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ search, page: String(page) });
    const res = await fetch(`/api/admin/audit-logs?${q}`);
    const d = await res.json();
    setData(d.data||[]); setTotal(d.total||0); setLoading(false);
  }, [search, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const actionColor = (action: string) => {
    if (action.includes("DELETE") || action.includes("DEACTIVATE") || action.includes("SUSPEND")) return "badge-danger";
    if (action.includes("LOGIN")) return "badge-blue";
    if (action.includes("CREATE") || action.includes("ACTIVATE")) return "badge-jade";
    if (action.includes("UPDATE") || action.includes("EXTEND")) return "badge-warn";
    return "badge-muted";
  };

  return (
    <div>
      <Topbar title="Audit Logs"  />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#667781]" />
            <input className="admin-input pl-9" placeholder="Search actions…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button onClick={fetch_} className="admin-btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4"/>Refresh</button>
          <span className="text-[#667781] text-sm ml-auto">{total} entries</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E9EDEF]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9EDEF] bg-[#EDE8DE]">
                {["Admin", "Action", "Entity", "Entity ID", "Timestamp", "Details"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667781]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-[#667781]">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-[#667781]">No audit logs yet</td></tr>
              ) : data.map(row => (
                <tr key={row.id} className="border-b border-[#E9EDEF]/50 hover:bg-[#EDE8DE]/20 transition-colors cursor-pointer"
                  onClick={() => setSelected(row)}>
                  <td className="px-4 py-3">
                    <p className="text-[#111B21] text-xs font-medium">{row.admin?.name || "System"}</p>
                    <p className="text-[#667781] text-[10px]">{row.admin_email}</p>
                  </td>
                  <td className="px-4 py-3"><span className={actionColor(row.action)}>{row.action}</span></td>
                  <td className="px-4 py-3 text-[#667781] text-xs capitalize">{row.entity_type || "—"}</td>
                  <td className="px-4 py-3 text-[#667781] text-[10px] font-mono">{row.entity_id ? row.entity_id.slice(0,10)+"…" : "—"}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs">{fmtDateTime(row.created_at)}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs max-w-[150px] truncate">
                    {row.details ? JSON.stringify(row.details) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[#667781] text-xs">Page {page} — {total} total</p>
          <div className="flex gap-2">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="admin-btn-secondary text-xs disabled:opacity-40">Previous</button>
            <button disabled={page*50>=total} onClick={()=>setPage(p=>p+1)} className="admin-btn-secondary text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={()=>setSelected(null)}>
          <div className="bg-white border border-[#E9EDEF] rounded-2xl p-6 w-full max-w-lg" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2"><ScrollText className="w-4 h-4 text-[#25D366]"/>Log Details</h2>
              <button onClick={()=>setSelected(null)} className="text-[#667781] hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-3">
              {[
                ["Admin", selected.admin?.name || "System"],
                ["Email", selected.admin_email],
                ["Action", selected.action],
                ["Entity", selected.entity_type],
                ["Entity ID", selected.entity_id],
                ["Timestamp", fmtDateTime(selected.created_at)],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[#667781] text-xs">{k}</span>
                  <span className="text-[#111B21] text-xs font-medium">{v || "—"}</span>
                </div>
              ))}
              {selected.details && Object.keys(selected.details).length > 0 && (
                <div>
                  <p className="text-[#667781] text-xs mb-2">Details</p>
                  <pre className="bg-[#EDE8DE] rounded-xl p-3 text-[#25D366] text-xs overflow-auto">
                    {JSON.stringify(selected.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
