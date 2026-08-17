"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDate } from "@/lib/utils";

export default function AutomationsPage() {
  const [data, setData]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/automations");
    setData(await res.json());
    setLoading(false);
  };
  useEffect(() => { fetch_(); }, []);

  const active   = data.filter(d => d.enabled === true).length;
  const inactive = data.length - active;

  const typeLabel = (t: string) => {
    if (t === "greeting")      return "Greeting";
    if (t === "ooo")           return "Out of Office";
    if (t === "keyword_rules") return "Keyword Rules";
    return t || "—";
  };

  return (
    <div>
      <Topbar title="Automations" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="admin-card px-4 py-3 text-center"><p className="text-2xl font-bold text-[#111B21]">{loading ? "…" : data.length}</p><p className="text-[#667781] text-xs">Total</p></div>
            <div className="admin-card px-4 py-3 text-center"><p className="text-2xl font-bold text-[#25D366]">{loading ? "…" : active}</p><p className="text-[#667781] text-xs">Active</p></div>
            <div className="admin-card px-4 py-3 text-center"><p className="text-2xl font-bold text-[#667781]">{loading ? "…" : inactive}</p><p className="text-[#667781] text-xs">Inactive</p></div>
          </div>
          <button onClick={fetch_} className="admin-btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4"/>Refresh</button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E9EDEF] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9EDEF] bg-[#EDE8DE]">
                {["Type", "Message", "User", "Status", "Created"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667781]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-[#667781]">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-[#667781]">No automations</td></tr>
              ) : data.map((row, i) => (
                <tr key={row.id || i} className="border-b border-[#E9EDEF] hover:bg-[#EDE8DE]/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 px-2 py-0.5 rounded font-medium">
                      {typeLabel(row.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#667781] text-xs max-w-[250px] truncate">{row.message || "—"}</td>
                  <td className="px-4 py-3 text-[#667781] text-xs">{row.user?.email || row.tenant_id?.slice(0,12)}</td>
                  <td className="px-4 py-3">
                    {row.enabled
                      ? <span className="badge-jade">Active</span>
                      : <span className="badge-muted">Inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-[#667781] text-xs">{fmtDate(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
