"use client";
import { useEffect, useState } from "react";
import {
  Users, DollarSign, MessageSquare, Megaphone, CheckCircle2,
  XCircle, Smartphone, FileText, BookUser, HeadphonesIcon, TrendingUp, Eye
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Topbar from "@/components/admin/Topbar";
import StatCard from "@/components/admin/StatCard";
import { fmtCurrency, fmtNumber, fmtDate } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const s = data?.stats ?? {};

  const num = (v: any) => fmtNumber(Number(v) || 0);
  const cur = (v: any) => fmtCurrency(Number(v) || 0);

  return (
    <div>
      <Topbar title="Dashboard" />
      <div className="p-6 space-y-6">

        {error && (
          <div className="bg-[#F43F5E]/10 border border-[#F43F5E]/20 rounded-xl px-4 py-3 text-sm text-[#F43F5E]">
            Error loading data: {error}
          </div>
        )}

        {/* Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Users"    value={loading ? "…" : num(s.totalUsers)}    icon={Users}      color="green" />
          <StatCard title="Total Revenue"  value={loading ? "…" : cur(s.totalRevenue)}  icon={DollarSign} color="blue" />
          <StatCard title="This Month"     value={loading ? "…" : cur(s.monthRevenue)}  icon={TrendingUp} color="purple" />
          <StatCard title="WA Accounts"    value={loading ? "…" : num(s.activeWA)}      icon={Smartphone} color="green" />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Messages Sent"   value={loading ? "…" : num(s.totalSent)}      icon={MessageSquare} color="blue" />
          <StatCard title="Delivered"       value={loading ? "…" : num(s.totalDelivered)} icon={CheckCircle2}  color="green"
            sub={`${s.deliveryRate ?? 0}% delivery rate`} />
          <StatCard title="Failed"          value={loading ? "…" : num(s.totalFailed)}    icon={XCircle}       color="red" />
          <StatCard title="Open Tickets"    value={loading ? "…" : num(s.openTickets)}    icon={HeadphonesIcon} color="yellow" />
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Campaigns" value={loading ? "…" : num(s.totalCampaigns)} icon={Megaphone}  color="purple" />
          <StatCard title="Templates"       value={loading ? "…" : num(s.totalTemplates)} icon={FileText}   color="blue" />
          <StatCard title="Total Contacts"  value={loading ? "…" : num(s.totalContacts)}  icon={BookUser}   color="green" />
          <StatCard title="Messages Read"   value={loading ? "…" : num(s.totalRead)}      icon={Eye}        color="blue" />
        </div>

        {/* Chart + Recent Signups */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 admin-card">
            <h2 className="text-sm font-bold text-[#111B21] mb-4">Revenue — Last 7 Days</h2>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-[#667781] text-sm">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.chartData ?? []} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9EDEF" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#667781", fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: "#667781", fontSize: 11 }} tickFormatter={v => `₹${v}`} width={55} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #E9EDEF", borderRadius: 8, color: "#111B21" }}
                    formatter={(v: any) => [cur(v), "Revenue"]}
                    labelFormatter={l => `Date: ${l}`}
                  />
                  <Bar dataKey="revenue" fill="#25D366" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="admin-card">
            <h2 className="text-sm font-bold text-[#111B21] mb-4">Recent Signups</h2>
            <div className="space-y-3">
              {loading
                ? <p className="text-[#667781] text-sm">Loading…</p>
                : (data?.recentUsers ?? []).length === 0
                  ? <p className="text-[#667781] text-sm">No signups yet</p>
                  : (data?.recentUsers ?? []).map((u: any) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#25D366] text-xs font-bold">
                          {(u.name || u.email || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#111B21] font-medium truncate">{u.name || "—"}</p>
                        <p className="text-[10px] text-[#667781] truncate">{u.email}</p>
                      </div>
                      <p className="text-[10px] text-[#667781] flex-shrink-0">{fmtDate(u.created_at)}</p>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="admin-card">
          <h2 className="text-sm font-bold text-[#111B21] mb-4">Recent Payments</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E9EDEF]">
                  {["Tenant", "Amount", "Status", "Date"].map(h => (
                    <th key={h} className="text-left pb-2 text-[10px] font-bold uppercase tracking-wider text-[#667781]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EDEF]">
                {loading ? (
                  <tr><td colSpan={4} className="py-4 text-center text-[#667781] text-xs">Loading…</td></tr>
                ) : (data?.recentPayments ?? []).length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-[#667781] text-xs">No payments yet</td></tr>
                ) : (data?.recentPayments ?? []).map((p: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2.5 text-[#667781] text-xs truncate max-w-[120px]">{p.tenant_id?.slice(0,8)}…</td>
                    <td className="py-2.5 text-[#111B21] font-semibold text-xs">{cur(p.amount)}</td>
                    <td className="py-2.5">
                      <span className={
                        p.status === "paid"    ? "badge-jade" :
                        p.status === "pending" ? "badge-warn" : "badge-danger"
                      }>{p.status}</span>
                    </td>
                    <td className="py-2.5 text-[#667781] text-xs">{fmtDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
