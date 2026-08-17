"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, Eye, UserX, UserCheck, ShieldOff } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDate, fmtCurrency } from "@/lib/utils";

export default function UsersPage() {
  const [users, setUsers]               = useState<any[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<{ user: any; action: string } | null>(null);
  const [reason, setReason]             = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ search, page: String(page) });
    const res  = await fetch(`/api/admin/users?${q}`);
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    const statusMap: Record<string, string> = { suspend: "suspended", activate: "active", deactivate: "deactivated" };
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: confirmAction.user.id, status: statusMap[confirmAction.action], reason }),
    });
    setConfirmAction(null); setReason(""); setActionLoading(false);
    fetchUsers();
  };

  const statusBadge = (s: string) => {
    if (s === "active")     return <span className="badge-jade">Active</span>;
    if (s === "suspended")  return <span className="badge-warn">Suspended</span>;
    if (s === "deactivated")return <span className="badge-danger">Deactivated</span>;
    return <span className="badge-jade">Active</span>;
  };

  const waBadge = (u: any) => {
    if (!u.wa) return <span className="badge-muted">Not connected</span>;
    if (u.wa.connected) return <span className="badge-jade">{u.wa.phone_number || "Connected"}</span>;
    return <span className="badge-warn">Disconnected</span>;
  };

  const planBadge = (u: any) => {
    if (u.plan && u.plan !== "free" && u.plan !== null) {
      return (
        <div>
          <span className="badge-jade capitalize">{u.plan}</span>
          {u.plan_expires_at && (
            <p className="text-[10px] text-[#667781] mt-0.5">Exp: {fmtDate(u.plan_expires_at)}</p>
          )}
        </div>
      );
    }
    return <span className="badge-muted">No plan</span>;
  };

  return (
    <div>
      <Topbar title="User Management" />
      <div className="p-6 space-y-4">

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#667781]" />
            <input className="admin-input pl-9" placeholder="Search by name or email…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button onClick={fetchUsers} className="admin-btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <span className="text-[#667781] text-sm ml-auto">{total} users</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E9EDEF] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9EDEF] bg-[#EDE8DE]">
                {["User", "Email", "WA Status", "Subscription", "Joined", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667781]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-[#667781]">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-[#667781]">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b border-[#E9EDEF] hover:bg-[#EDE8DE]/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#25D366] text-xs font-bold">
                          {(u.name || u.email || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[#111B21] text-xs font-medium">{u.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#667781] text-xs">{u.email}</td>
                  <td className="px-4 py-3">{waBadge(u)}</td>
                  <td className="px-4 py-3">{planBadge(u)}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs">{fmtDate(u.created_at)}</td>
                  <td className="px-4 py-3">{statusBadge(u.account_status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(u)} title="View"
                        className="p-1.5 rounded-lg hover:bg-[#EDE8DE] text-[#667781] hover:text-[#111B21] transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {u.account_status !== "active" ? (
                        <button onClick={() => setConfirmAction({ user: u, action: "activate" })} title="Activate"
                          className="p-1.5 rounded-lg hover:bg-[#25D366]/10 text-[#25D366] transition-colors">
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => setConfirmAction({ user: u, action: "suspend" })} title="Suspend"
                          className="p-1.5 rounded-lg hover:bg-[#F59E0B]/10 text-[#F59E0B] transition-colors">
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => setConfirmAction({ user: u, action: "deactivate" })} title="Deactivate"
                        className="p-1.5 rounded-lg hover:bg-[#F43F5E]/10 text-[#F43F5E] transition-colors">
                        <ShieldOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-[#667781] text-xs">Page {page} — {Math.max(1, Math.ceil(total / 20))} pages</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="admin-btn-secondary text-xs disabled:opacity-40">Previous</button>
            <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="admin-btn-secondary text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white border border-[#E9EDEF] rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#111B21]">User Details</h2>
              <button onClick={() => setSelected(null)} className="text-[#667781] hover:text-[#111B21] text-xl leading-none">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Name",        selected.name || "—"],
                ["Email",       selected.email],
                ["ID",          selected.id?.slice(0,12) + "…"],
                ["Joined",      fmtDate(selected.created_at)],
                ["Plan",        selected.plan || "No plan"],
                ["Plan Expires",fmtDate(selected.plan_expires_at)],
                ["WA Phone",    selected.wa?.phone_number || "Not connected"],
                ["WA Status",   selected.wa?.connected ? "Connected" : "Not connected"],
              ].map(([k, v]) => (
                <div key={k} className="bg-[#EDE8DE] rounded-lg p-3">
                  <p className="text-[10px] text-[#667781] uppercase tracking-wider mb-1">{k}</p>
                  <p className="text-[#111B21] text-xs font-medium break-all">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E9EDEF] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-bold text-[#111B21] mb-2 capitalize">{confirmAction.action} User</h2>
            <p className="text-[#667781] text-sm mb-4">
              Are you sure you want to {confirmAction.action}{" "}
              <strong className="text-[#111B21]">{confirmAction.user.email}</strong>?
            </p>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              className="admin-input mb-4 resize-none" rows={2} placeholder="Reason (optional)" />
            <div className="flex gap-3">
              <button onClick={() => { setConfirmAction(null); setReason(""); }} className="admin-btn-secondary flex-1">Cancel</button>
              <button onClick={handleAction} disabled={actionLoading}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
                  confirmAction.action === "activate" ? "bg-[#25D366] text-[#111B21] hover:bg-[#128C7E] hover:text-white" : "admin-btn-danger"
                }`}>
                {actionLoading ? "…" : `Confirm`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
