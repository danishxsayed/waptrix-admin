"use client";
import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { fmtDate } from "@/lib/utils";

export default function WhatsAppPage() {
  const [data, setData]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch_ = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/whatsapp");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || `API error ${res.status}`);
        setData([]);
      } else {
        setData(Array.isArray(json) ? json : []);
      }
    } catch (e: any) {
      setError(e.message || "Network error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch_(); }, []);

  const connected    = data.filter(d => d.waba_id && d.waba_id !== "pending").length;
  const disconnected = data.length - connected;

  return (
    <div>
      <Topbar title="WhatsApp Accounts" />
      <div className="p-6 space-y-4">

        {error && (
          <div className="bg-[#F43F5E]/10 border border-[#F43F5E]/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-[#F43F5E]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Accounts", value: data.length,  color: "text-[#111B21]" },
            { label: "Connected",      value: connected,    color: "text-[#25D366]"  },
            { label: "Disconnected",   value: disconnected, color: "text-[#F43F5E]"  },
          ].map(({ label, value, color }) => (
            <div key={label} className="admin-card text-center">
              <p className={`text-3xl font-bold ${color}`}>{loading ? "…" : value}</p>
              <p className="text-[#667781] text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button onClick={fetch_} className="admin-btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E9EDEF] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9EDEF] bg-[#EDE8DE]">
                {["User", "Phone Number", "WABA ID", "Status", "Connected At"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667781]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-[#667781]">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-[#667781]">
                  {error ? "Failed to load data" : "No WhatsApp accounts found"}
                </td></tr>
              ) : data.map(row => {
                const isConnected = row.waba_id && row.waba_id !== "pending";
                return (
                  <tr key={row.id} className="border-b border-[#E9EDEF] hover:bg-[#EDE8DE]/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[#111B21] text-xs font-medium">{row.user?.name || row.user?.email || "—"}</p>
                      <p className="text-[#667781] text-[10px]">{row.user?.email || row.tenant_id?.slice(0,16)}</p>
                    </td>
                    <td className="px-4 py-3 text-[#667781] text-xs font-mono">{row.phone_number || "—"}</td>
                    <td className="px-4 py-3 text-[#667781] text-[10px] font-mono truncate max-w-[160px]">{row.waba_id || "—"}</td>
                    <td className="px-4 py-3">
                      {isConnected
                        ? <span className="badge-jade flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/>Connected</span>
                        : <span className="badge-warn flex items-center gap-1 w-fit"><XCircle className="w-3 h-3"/>Pending</span>}
                    </td>
                    <td className="px-4 py-3 text-[#667781] text-xs">{fmtDate(row.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
