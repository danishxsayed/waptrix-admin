"use client";
import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, Link, ToggleLeft, ToggleRight, Save, Trash2, Upload, Eye, EyeOff, Loader2 } from "lucide-react";

export default function PopupManagementPage() {
  const [config, setConfig]     = useState({ enabled: false, image_url: "", link_url: "/pricing" });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/popup")
      .then((r) => r.json())
      .then((d) => { setConfig({ enabled: !!d.enabled, image_url: d.image_url || "", link_url: d.link_url || "/pricing" }); })
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function save(patch?: Partial<typeof config>) {
    setSaving(true);
    const payload = { ...config, ...patch };
    const res = await fetch("/api/admin/popup", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setConfig({ enabled: !!data.enabled, image_url: data.image_url || "", link_url: data.link_url || "/pricing" });
      showToast("Popup saved successfully!");
    } else {
      showToast(data.error || "Failed to save", false);
    }
    setSaving(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Upload to Supabase storage via admin API
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/popup/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok && data.url) {
        setConfig((prev) => ({ ...prev, image_url: data.url }));
        showToast("Image uploaded! Click Save to apply.");
      } else {
        showToast(data.error || "Upload failed", false);
      }
    } catch {
      showToast("Upload failed", false);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${toast.ok ? "bg-emerald-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Popup Manager</h1>
        <p className="text-sm text-gray-500 mt-1">Control the offer popup shown on the marketing website.</p>
      </div>

      <div className="space-y-5">

        {/* Enable / Disable */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800">Popup Status</p>
            <p className="text-sm text-gray-500 mt-0.5">{config.enabled ? "Live — visitors will see this popup" : "Paused — popup is hidden from all visitors"}</p>
          </div>
          <button
            onClick={() => save({ enabled: !config.enabled })}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all"
            style={{ background: config.enabled ? "#ECFDF5" : "#F1F5F9", color: config.enabled ? "#059669" : "#64748B" }}
          >
            {config.enabled
              ? <><ToggleRight className="w-5 h-5" /> Enabled</>
              : <><ToggleLeft className="w-5 h-5" /> Disabled</>
            }
          </button>
        </div>

        {/* Image preview */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-4 h-4 text-gray-500" />
            <p className="font-semibold text-gray-800">Popup Image</p>
          </div>

          {config.image_url ? (
            <div className="relative mb-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center" style={{ minHeight: 200 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.image_url} alt="Popup preview" className="max-h-72 w-auto object-contain" />
              <button
                onClick={() => setConfig((p) => ({ ...p, image_url: "" }))}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="mb-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
              <ImageIcon className="w-10 h-10" />
              <p className="text-sm">No image set</p>
            </div>
          )}

          {/* Upload file */}
          <div className="flex gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Uploading…" : "Upload Image"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>

          {/* Or paste URL */}
          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Or paste image URL</label>
            <input
              type="url"
              value={config.image_url}
              onChange={(e) => setConfig((p) => ({ ...p, image_url: e.target.value }))}
              placeholder="https://example.com/offer.png"
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>

        {/* Link URL */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link className="w-4 h-4 text-gray-500" />
            <p className="font-semibold text-gray-800">Click Destination</p>
          </div>
          <p className="text-xs text-gray-500 mb-2">Where users go when they click the popup image.</p>
          <input
            type="text"
            value={config.link_url}
            onChange={(e) => setConfig((p) => ({ ...p, link_url: e.target.value }))}
            placeholder="/pricing"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        {/* Preview note */}
        {config.image_url && (
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
            <Eye className="w-4 h-4 flex-shrink-0" />
            Preview: visit <a href="https://waptrix.in" target="_blank" rel="noopener noreferrer" className="font-semibold underline ml-1">waptrix.in</a> after saving to see it live.
          </div>
        )}

        {/* Save button */}
        <button
          onClick={() => save()}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl transition-colors disabled:opacity-60 text-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>

      </div>
    </div>
  );
}
