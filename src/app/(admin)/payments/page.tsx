"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, DollarSign, TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDate, fmtCurrency } from "@/lib/utils";

export default function PaymentsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ totalRevenue: 0, monthRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ search, status: statusFilter, page: String(page) });
    const res = await fetch(`/api/admin/payments?${q}`);
    const d = await res.json();
    setData(d.data||[]); setTotal(d.total||0); setSummary(d.summary||{}); setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const statusBadge = (s: string) => {
    if (s === "paid") return <span className="badge-jade">Paid</span>;
    if (s === "pending") return <span className="badge-warn">Pending</span>;
    if (s === "failed") return <span className="badge-danger">Failed</span>;
    return <span className="badge-muted">{s}</span>;
  };

  return (
    <div>
      <Topbar title="Payments & Billing"  />
      <div className="p-6 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: fmtCurrency(summary.totalRevenue), icon: DollarSign, color: "text-[#25D366]", bg: "bg-[#25D366]/10 border-[#25D366]/20" },
            { label: "This Month", value: fmtCurrency(summary.monthRevenue), icon: TrendingUp, color: "text-[#0EA5E9]", bg: "bg-[#0EA5E9]/10 border-[#0EA5E9]/20" },
            { label: "Total Txns", value: total, icon: CheckCircle2, color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10 border-[#F59E0B]/20" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="admin-card flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-[#111B21] font-bold text-lg">{loading ? "…" : value}</p>
                <p className="text-[#667781] text-xs">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#667781]" />
            <input className="admin-input pl-9" placeholder="Search by order ID…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="admin-input w-36" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={fetch_} className="admin-btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E9EDEF]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9EDEF] bg-[#EDE8DE]">
                {["User", "Amount", "Plan", "Order ID", "CF Order ID", "Status", "Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667781]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-[#667781]">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-[#667781]">No payments found</td></tr>
              ) : data.map(row => (
                <tr key={row.id} className="border-b border-[#E9EDEF]/50 hover:bg-[#EDE8DE]/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[#111B21] text-xs font-medium">{row.user?.full_name || row.user?.email || "—"}</p>
                    <p className="text-[#667781] text-[10px]">{row.user?.email || row.tenant_id?.slice(0,10)}</p>
                  </td>
                  <td className="px-4 py-3 text-[#111B21] font-bold text-xs">{fmtCurrency(Number(row.amount||0))}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs capitalize">{row.plan||"—"}</td>
                  <td className="px-4 py-3 text-[#667781] text-[10px] font-mono">{row.order_id||"—"}</td>
                  <td className="px-4 py-3 text-[#667781] text-[10px] font-mono">{row.cf_order_id||"—"}</td>
                  <td className="px-4 py-3">{statusBadge(row.status)}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs">{fmtDate(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[#667781] text-xs">Page {page} — {total} total</p>
          <div className="flex gap-2">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="admin-btn-secondary text-xs disabled:opacity-40">Previous</button>
            <button disabled={page*25>=total} onClick={()=>setPage(p=>p+1)} className="admin-btn-secondary text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
