"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, Phone, MessageCircle, Mail, Eye } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDate } from "@/lib/utils";

const USE_CASE_LABELS: Record<string, string> = {
  campaigns:    "Campaigns",
  inbox:        "Inbox",
  orders:       "Orders",
  appointments: "Appointments",
  flows:        "Flows",
  crm:          "CRM",
};

const CONTACT_ICON: Record<string, JSX.Element> = {
  whatsapp: <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />,
  phone:    <Phone className="w-3.5 h-3.5 text-[#3B82F6]" />,
  email:    <Mail className="w-3.5 h-3.5 text-[#F59E0B]" />,
};

export default function LeadsPage() {
  const [leads, setLeads]     = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [page, setPage]       = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ search, filter, page: String(page) });
    const res  = await fetch(`/api/admin/leads?${q}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, filter, page]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const trialStatus = (u: any) => {
    if (u.plan === "pro") return <span className="badge-jade">Pro</span>;
    if (!u.trial_ends_at) return <span className="badge-muted">—</span>;
    const expired = new Date(u.trial_ends_at) < new Date();
    if (expired) return (
      <div>
        <span className="badge-danger">Expired</span>
        <p className="text-[10px] text-[#667781] mt-0.5">{fmtDate(u.trial_ends_at)}</p>
      </div>
    );
    return (
      <div>
        <span className="badge-warn">Trial</span>
        <p className="text-[10px] text-[#667781] mt-0.5">Ends {fmtDate(u.trial_ends_at)}</p>
      </div>
    );
  };

  return (
    <div>
      <Topbar title="Leads & Onboarding" />
      <div className="p-6 space-y-4">

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#667781]" />
            <input className="admin-input pl-9" placeholder="Search by name, email or phone…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="flex gap-1 bg-[#EDE8DE] rounded-xl p-1">
            {[
              { id: "all",       label: "All" },
              { id: "onboarded", label: "Onboarded" },
              { id: "trial",     label: "Trial" },
              { id: "expired",   label: "Expired" },
            ].map(f => (
              <button key={f.id}
                onClick={() => { setFilter(f.id); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === f.id
                    ? "bg-white text-[#111B21] shadow-sm"
                    : "text-[#667781] hover:text-[#111B21]"
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={fetchLeads} className="admin-btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <span className="text-[#667781] text-sm ml-auto">{total} leads</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E9EDEF] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9EDEF] bg-[#EDE8DE]">
                {["User", "Phone", "Contact Via", "Business", "Use Cases", "Volume", "Source", "Plan", "Joined", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667781]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="py-12 text-center text-[#667781]">Loading…</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-[#667781]">No leads found</td></tr>
              ) : leads.map(u => (
                <tr key={u.id} className="border-b border-[#E9EDEF] hover:bg-[#EDE8DE]/40 transition-colors">
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#25D366] text-xs font-bold">
                          {(u.name || u.email || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-[#111B21] text-xs font-medium">{u.name || "—"}</p>
                        <p className="text-[#667781] text-[10px]">{u.email}</p>
                        {!u.onboarding_done && (
                          <span className="text-[9px] text-[#F59E0B] font-semibold">No onboarding</span>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Phone */}
                  <td className="px-4 py-3">
                    {u.phone ? (
                      <div>
                        <a href={`tel:${u.phone}`} className="text-xs text-[#075E54] font-medium hover:underline">{u.phone}</a>
                        {u.is_whatsapp && (
                          <p className="text-[9px] text-[#25D366] mt-0.5 flex items-center gap-1">
                            <MessageCircle className="w-2.5 h-2.5" /> WhatsApp
                          </p>
                        )}
                      </div>
                    ) : <span className="text-[#667781] text-xs">—</span>}
                  </td>
                  {/* Contact via */}
                  <td className="px-4 py-3">
                    {u.preferred_contact ? (
                      <div className="flex items-center gap-1.5">
                        {CONTACT_ICON[u.preferred_contact] || null}
                        <span className="text-xs text-[#111B21] capitalize">{u.preferred_contact}</span>
                      </div>
                    ) : <span className="text-[#667781] text-xs">—</span>}
                  </td>
                  {/* Business */}
                  <td className="px-4 py-3">
                    <p className="text-xs text-[#111B21] font-medium">{u.industry || "—"}</p>
                    {u.role && <p className="text-[10px] text-[#667781]">{u.role}</p>}
                    {u.team_size && <p className="text-[10px] text-[#667781]">Team: {u.team_size}</p>}
                  </td>
                  {/* Use cases */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {(u.use_cases || []).length > 0
                        ? (u.use_cases as string[]).map((uc: string) => (
                            <span key={uc} className="text-[9px] bg-[#EDE8DE] text-[#667781] px-1.5 py-0.5 rounded-full">
                              {USE_CASE_LABELS[uc] || uc}
                            </span>
                          ))
                        : <span className="text-[#667781] text-xs">—</span>
                      }
                    </div>
                  </td>
                  {/* Volume */}
                  <td className="px-4 py-3 text-xs text-[#111B21]">{u.msg_volume || "—"}</td>
                  {/* Source */}
                  <td className="px-4 py-3 text-xs text-[#667781]">{u.referral_source || "—"}</td>
                  {/* Plan */}
                  <td className="px-4 py-3">{trialStatus(u)}</td>
                  {/* Joined */}
                  <td className="px-4 py-3 text-[#667781] text-xs whitespace-nowrap">{fmtDate(u.created_at)}</td>
                  {/* Action */}
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(u)} title="View"
                      className="p-1.5 rounded-lg hover:bg-[#EDE8DE] text-[#667781] hover:text-[#111B21] transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-[#667781] text-xs">Page {page} — {Math.max(1, Math.ceil(total / 25))} pages</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="admin-btn-secondary text-xs disabled:opacity-40">Previous</button>
            <button disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)} className="admin-btn-secondary text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white border border-[#E9EDEF] rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center">
                  <span className="text-[#25D366] font-bold">{(selected.name || selected.email || "?")[0].toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-bold text-[#111B21]">{selected.name || "—"}</p>
                  <p className="text-xs text-[#667781]">{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#667781] hover:text-[#111B21] text-xl leading-none">×</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Phone",          selected.phone || "—"],
                ["Contact via",    selected.preferred_contact || "—"],
                ["WhatsApp",       selected.is_whatsapp ? "Yes" : "No"],
                ["Industry",       selected.industry || "—"],
                ["Role",           selected.role || "—"],
                ["Team size",      selected.team_size || "—"],
                ["Msg volume",     selected.msg_volume || "—"],
                ["Referral",       selected.referral_source || "—"],
                ["Plan",           selected.plan || "—"],
                ["Trial ends",     fmtDate(selected.trial_ends_at)],
                ["Joined",         fmtDate(selected.created_at)],
                ["Onboarded",      selected.onboarding_done ? "Yes" : "No"],
              ].map(([k, v]) => (
                <div key={k} className="bg-[#EDE8DE] rounded-lg p-3">
                  <p className="text-[10px] text-[#667781] uppercase tracking-wider mb-1">{k}</p>
                  <p className="text-[#111B21] text-xs font-medium break-all capitalize">{v}</p>
                </div>
              ))}
            </div>

            {/* Use cases */}
            {(selected.use_cases || []).length > 0 && (
              <div className="mt-3 bg-[#EDE8DE] rounded-lg p-3">
                <p className="text-[10px] text-[#667781] uppercase tracking-wider mb-2">Use cases</p>
                <div className="flex flex-wrap gap-1.5">
                  {(selected.use_cases as string[]).map((uc: string) => (
                    <span key={uc} className="text-xs bg-[#25D366]/15 text-[#075E54] px-2.5 py-1 rounded-full font-medium">
                      {USE_CASE_LABELS[uc] || uc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Call CTA */}
            {selected.phone && (
              <div className="mt-4 flex gap-3">
                <a href={`tel:${selected.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-[#111B21] font-bold py-2.5 rounded-xl text-sm hover:bg-[#128C7E] hover:text-white transition-all">
                  <Phone className="w-4 h-4" /> Call
                </a>
                {selected.is_whatsapp && (
                  <a href={`https://wa.me/${selected.phone?.replace(/\D/g, "")}`} target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#075E54] font-bold py-2.5 rounded-xl text-sm hover:bg-[#25D366]/10 transition-all">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
