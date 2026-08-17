export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServiceClient();
  const url    = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page   = parseInt(url.searchParams.get("page") || "1");
  const limit  = 20;
  const offset = (page - 1) * limit;

  // tenants table already has plan + plan_expires_at columns
  let q = db.from("tenants")
    .select("id, name, email, plan, plan_expires_at, created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (search) q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%`);

  const { data: tenants, count } = await q.range(offset, offset + limit - 1);
  if (!tenants) return NextResponse.json({ users: [], total: 0 });

  const tenantIds = tenants.map((t: any) => t.id);

  // WA connections — connected = record exists with non-null waba_id
  const { data: waConns } = await db
    .from("wa_connections")
    .select("tenant_id, phone_number, waba_id")
    .in("tenant_id", tenantIds);

  const waMap: Record<string, any> = {};
  (waConns ?? []).forEach((w: any) => { waMap[w.tenant_id] = w; });

  // Recent payment for each tenant
  const { data: payments } = await db
    .from("payments")
    .select("tenant_id, status, billing_cycle, amount, created_at, plan_id")
    .in("tenant_id", tenantIds)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  const payMap: Record<string, any> = {};
  (payments ?? []).forEach((p: any) => { if (!payMap[p.tenant_id]) payMap[p.tenant_id] = p; });

  const users = tenants.map((t: any) => {
    const wa = waMap[t.id];
    const isWaConnected = wa && wa.waba_id && wa.waba_id !== "pending";
    return {
      ...t,
      // plan comes from tenants.plan directly
      hasPlan: !!t.plan && t.plan !== "free",
      payment: payMap[t.id] || null,
      wa: wa ? { ...wa, connected: isWaConnected } : null,
      // default active — only change if explicitly stored otherwise
      account_status: "active",
    };
  });

  return NextResponse.json({ users, total: count || 0, page, limit });
}

export async function PATCH(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { user_id, status, reason } = await req.json();
  if (!user_id || !status) return NextResponse.json({ error: "user_id and status required" }, { status: 400 });

  const db = getServiceClient();
  // store in user_status table if it exists, ignore error if not
  try {
    await db.from("user_status").upsert({
      user_id, status, reason: reason || null,
      updated_by: admin.id, updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
  } catch {}

  return NextResponse.json({ ok: true });
}
