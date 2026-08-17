"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDate } from "@/lib/utils";

export default function ContactsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ search, page: String(page) });
    const res = await fetch(`/api/admin/contacts?${q}`);
    const d = await res.json();
    setData(d.data||[]); setTotal(d.total||0); setLoading(false);
  }, [search, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return (
    <div>
      <Topbar title="Contacts"  />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#667781]" />
            <input className="admin-input pl-9" placeholder="Search by name, phone, email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button onClick={fetch_} className="admin-btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4"/>Refresh</button>
          <span className="text-[#667781] text-sm ml-auto">{total} contacts</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E9EDEF]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9EDEF] bg-[#EDE8DE]">
                {["Name", "Phone", "Email", "Opted In", "Tags", "Tenant", "Created"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667781]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-[#667781]">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-[#667781]">No contacts</td></tr>
              ) : data.map(row => (
                <tr key={row.id} className="border-b border-[#E9EDEF]/50 hover:bg-[#EDE8DE]/40 transition-colors">
                  <td className="px-4 py-3 text-[#111B21] text-xs font-medium">{row.name || "—"}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs font-mono">{row.phone || "—"}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs">{row.email || "—"}</td>
                  <td className="px-4 py-3">
                    {row.opted_in ? <span className="badge-jade">Yes</span> : <span className="badge-danger">No</span>}
                  </td>
                  <td className="px-4 py-3 text-[#667781] text-xs">{row.custom2 || "—"}</td>
                  <td className="px-4 py-3 text-[#667781] text-[10px] font-mono">{row.tenant?.email || row.tenant_id?.slice(0,8) + "…"}</td>
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
