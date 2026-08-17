"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDate, fmtCurrency } from "@/lib/utils";

export default function SubscriptionsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [extending, setExtending] = useState<any>(null);
  const [extendDate, setExtendDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ search, status: statusFilter, page: String(page) });
    const res = await fetch(`/api/admin/subscriptions?${q}`);
    const d = await res.json();
    setData(d.data || []); setTotal(d.total || 0); setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const doAction = async (id: string, action: string, expires_at?: string) => {
    setActionLoading(true);
    await fetch("/api/admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: id, action, expires_at }),
    });
    setExtending(null); setActionLoading(false); fetch_();
  };

  const statusIcon = (s: string) => {
    if (s === "paid") return <span className="badge-jade flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Active</span>;
    if (s === "pending") return <span className="badge-warn flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>;
    return <span className="badge-danger flex items-center gap-1"><XCircle className="w-3 h-3" />{s}</span>;
  };

  return (
    <div>
      <Topbar title="Subscriptions & Plans"  />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#667781]" />
            <input className="admin-input pl-9" placeholder="Search by tenant ID…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="admin-input w-36" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="paid">Active</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={fetch_} className="admin-btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
          <span className="text-[#667781] text-sm ml-auto">{total} records</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E9EDEF]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9EDEF] bg-[#EDE8DE]">
                {["User", "Plan", "Amount", "Status", "Expires", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667781]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-[#667781]">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-[#667781]">No subscriptions found</td></tr>
              ) : data.map(row => (
                <tr key={row.id} className="border-b border-[#E9EDEF]/50 hover:bg-[#EDE8DE]/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[#111B21] text-xs font-medium">{row.user?.name || row.user?.email || "—"}</p>
                    <p className="text-[#667781] text-[10px]">{row.user?.email || row.tenant_id?.slice(0,12) + "…"}</p>
                  </td>
                  <td className="px-4 py-3 text-[#667781] text-xs capitalize">{row.plan_id || row.plan || "—"}</td>
                  <td className="px-4 py-3 text-[#111B21] font-semibold text-xs">{fmtCurrency(Number(row.amount || 0))}</td>
                  <td className="px-4 py-3">{statusIcon(row.status)}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs">{fmtDate(row.expires_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {row.status !== "paid" && (
                        <button onClick={() => doAction(row.id, "activate")} className="px-2 py-1 rounded text-[10px] bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20">Activate</button>
                      )}
                      <button onClick={() => { setExtending(row); setExtendDate(row.expires_at?.slice(0,10) || ""); }}
                        className="px-2 py-1 rounded text-[10px] bg-[#0EA5E9]/10 text-[#0EA5E9] hover:bg-[#0EA5E9]/20 border border-[#0EA5E9]/20 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />Extend
                      </button>
                      {row.status === "paid" && (
                        <button onClick={() => doAction(row.id, "cancel")}
                          className="px-2 py-1 rounded text-[10px] bg-[#F43F5E]/10 text-[#F43F5E] hover:bg-[#F43F5E]/20 border border-[#F43F5E]/20">Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[#667781] text-xs">Page {page}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="admin-btn-secondary text-xs disabled:opacity-40">Previous</button>
            <button disabled={page*20 >= total} onClick={() => setPage(p => p+1)} className="admin-btn-secondary text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {extending && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E9EDEF] rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-base font-bold text-[#111B21] mb-4">Extend Subscription</h2>
            <p className="text-[#667781] text-sm mb-3">{extending.user?.email || extending.tenant_id?.slice(0,12)}</p>
            <label className="text-xs text-[#667781] uppercase tracking-wider mb-1.5 block">New Expiry Date</label>
            <input type="date" className="admin-input mb-4" value={extendDate} onChange={e => setExtendDate(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setExtending(null)} className="admin-btn-secondary flex-1">Cancel</button>
              <button onClick={() => doAction(extending.id, "extend", new Date(extendDate).toISOString())}
                disabled={!extendDate || actionLoading} className="admin-btn-primary flex-1 disabled:opacity-40">
                {actionLoading ? "…" : "Extend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
