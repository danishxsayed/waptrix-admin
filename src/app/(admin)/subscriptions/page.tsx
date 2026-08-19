"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, Calendar, CheckCircle2, XCircle, Clock, CreditCard, TrendingUp, Users, AlertCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDate, fmtCurrency } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; icon: any; cls: string; dot: string }> = {
  paid:      { label: "Active",    icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  pending:   { label: "Pending",   icon: Clock,        cls: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-400"  },
  failed:    { label: "Failed",    icon: XCircle,      cls: "bg-red-50 text-red-700 border-red-200",             dot: "bg-red-500"    },
  cancelled: { label: "Cancelled", icon: XCircle,      cls: "bg-slate-50 text-slate-500 border-slate-200",       dot: "bg-slate-400"  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function Avatar({ name, email }: { name?: string; email?: string }) {
  const label = (name || email || "?")[0].toUpperCase();
  const colors = ["bg-violet-100 text-violet-700", "bg-sky-100 text-sky-700", "bg-rose-100 text-rose-700", "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700"];
  const color = colors[label.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}>
      {label}
    </div>
  );
}

export default function SubscriptionsPage() {
  const [data, setData]               = useState<any[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]               = useState(1);
  const [extending, setExtending]     = useState<any>(null);
  const [extendDate, setExtendDate]   = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ search, status: statusFilter, page: String(page) });
    const res = await fetch(`/api/admin/subscriptions?${q}`);
    const d = await res.json();
    setData(d.data || []); setTotal(d.total || 0); setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const doAction = async (id: string, action: string, expires_at?: string) => {
    setActionLoading(id + action);
    await fetch("/api/admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: id, action, expires_at }),
    });
    setExtending(null);
    setActionLoading(null);
    fetch_();
  };

  // Summary stats
  const active    = data.filter(d => d.status === "paid").length;
  const pending   = data.filter(d => d.status === "pending").length;
  const revenue   = data.filter(d => d.status === "paid").reduce((s, d) => s + Number(d.amount || 0), 0);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Topbar title="Subscriptions & Plans" />

      <div className="p-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Records",    value: total,   icon: CreditCard,  color: "text-violet-600 bg-violet-50" },
            { label: "Active",           value: active,  icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
            { label: "Pending",          value: pending, icon: Clock,       color: "text-amber-600 bg-amber-50" },
            { label: "Active Revenue",   value: fmtCurrency(revenue), icon: TrendingUp, color: "text-sky-600 bg-sky-50", isStr: true },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-[#E9EDEF] p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-[#667781] uppercase tracking-wider font-semibold">{stat.label}</p>
                <p className="text-xl font-bold text-[#111B21]">{stat.isStr ? stat.value : stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[#E9EDEF] p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#667781]" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm bg-[#F8F9FA] border border-[#E9EDEF] rounded-xl focus:outline-none focus:border-[#25D366] transition-colors"
                placeholder="Search by email or tenant ID…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="px-3 py-2 text-sm bg-[#F8F9FA] border border-[#E9EDEF] rounded-xl focus:outline-none focus:border-[#25D366] text-[#111B21]"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Status</option>
              <option value="paid">Active</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={fetch_}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#F8F9FA] border border-[#E9EDEF] rounded-xl hover:bg-[#EDE8DE] transition-colors text-[#111B21] font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E9EDEF] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E9EDEF] bg-[#F8F9FA]">
                  {["User", "Plan", "Amount", "Status", "Expires", "Actions"].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[#667781]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-[#F0F2F5] rounded animate-pulse" style={{ width: j === 0 ? "140px" : "60px" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <AlertCircle className="w-8 h-8 text-[#667781] mx-auto mb-2 opacity-40" />
                      <p className="text-[#667781] text-sm">No subscriptions found</p>
                    </td>
                  </tr>
                ) : data.map(row => (
                  <tr key={row.id} className="hover:bg-[#F8F9FA] transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={row.user?.name} email={row.user?.email} />
                        <div>
                          <p className="text-[#111B21] text-xs font-semibold leading-tight">
                            {row.user?.name || "Unknown"}
                          </p>
                          <p className="text-[#667781] text-[10px] mt-0.5">
                            {row.user?.email || row.tenant_id?.slice(0, 16) + "…"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {row.plan_id || row.plan || "Pro"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[#111B21] font-bold text-xs">{fmtCurrency(Number(row.amount || 0))}</span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-4">
                      {row.expires_at ? (
                        <div>
                          <p className="text-[#111B21] text-xs font-medium">{fmtDate(row.expires_at)}</p>
                          {row.status === "paid" && new Date(row.expires_at) < new Date(Date.now() + 7 * 86400000) && (
                            <p className="text-red-500 text-[10px] mt-0.5 font-semibold">Expiring soon</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#667781] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {row.status !== "paid" && (
                          <button
                            onClick={() => doAction(row.id, "activate")}
                            disabled={actionLoading === row.id + "activate"}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === row.id + "activate" ? "…" : "Activate"}
                          </button>
                        )}
                        <button
                          onClick={() => { setExtending(row); setExtendDate(row.expires_at?.slice(0, 10) || ""); }}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3" /> Extend
                        </button>
                        {row.status === "paid" && (
                          <button
                            onClick={() => doAction(row.id, "cancel")}
                            disabled={actionLoading === row.id + "cancel"}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === row.id + "cancel" ? "…" : "Cancel"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="px-5 py-4 border-t border-[#F0F2F5] flex items-center justify-between bg-[#F8F9FA]">
              <p className="text-[#667781] text-xs">
                Showing {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of <span className="font-semibold text-[#111B21]">{total}</span> records
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E9EDEF] bg-white hover:bg-[#EDE8DE] disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-[#111B21] font-semibold px-2">
                  {page} / {totalPages || 1}
                </span>
                <button
                  disabled={page * 20 >= total}
                  onClick={() => setPage(p => p + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E9EDEF] bg-white hover:bg-[#EDE8DE] disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Extend modal */}
      {extending && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-[#E9EDEF]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-[#111B21]">Extend Subscription</h2>
              <button onClick={() => setExtending(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#F0F2F5] transition-colors">
                <X className="w-4 h-4 text-[#667781]" />
              </button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#F8F9FA] rounded-xl mb-5">
              <Avatar name={extending.user?.name} email={extending.user?.email} />
              <div>
                <p className="text-xs font-semibold text-[#111B21]">{extending.user?.name || "Unknown"}</p>
                <p className="text-[10px] text-[#667781]">{extending.user?.email || extending.tenant_id?.slice(0, 16)}</p>
              </div>
            </div>
            <label className="text-[10px] font-bold text-[#667781] uppercase tracking-widest mb-2 block">New Expiry Date</label>
            <input
              type="date"
              className="w-full px-3 py-2.5 text-sm bg-[#F8F9FA] border border-[#E9EDEF] rounded-xl focus:outline-none focus:border-[#25D366] mb-5 text-[#111B21]"
              value={extendDate}
              onChange={e => setExtendDate(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setExtending(null)} className="flex-1 py-2.5 text-sm font-semibold border border-[#E9EDEF] rounded-xl hover:bg-[#F8F9FA] transition-colors text-[#667781]">
                Cancel
              </button>
              <button
                onClick={() => doAction(extending.id, "extend", new Date(extendDate).toISOString())}
                disabled={!extendDate || !!actionLoading}
                className="flex-1 py-2.5 text-sm font-bold bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] transition-colors disabled:opacity-40"
              >
                {actionLoading ? "Saving…" : "Extend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
