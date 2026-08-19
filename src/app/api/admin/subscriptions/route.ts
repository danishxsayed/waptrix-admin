export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getServiceClient();
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 20;

  let q = db.from("payments").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  if (search) q = q.ilike("tenant_id", `%${search}%`);
  const { data, count } = await q.range((page-1)*limit, page*limit-1);

  // Enrich with user email
  const tenantIds = [...new Set((data || []).map((d: any) => d.tenant_id))];
  const { data: profiles } = await db.from("tenants").select("id, email, name").in("id", tenantIds);
  const profileMap: Record<string, any> = {};
  (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

  const enriched = (data || []).map((d: any) => ({ ...d, user: profileMap[d.tenant_id] || null }));
  return NextResponse.json({ data: enriched, total: count || 0 });
}

export async function PATCH(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin","admin"].includes(admin.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { payment_id, action, expires_at } = await req.json();
  const db = getServiceClient();

  const paymentUpdate: Record<string, any> = {
    activate: { status: "paid" },
    cancel:   { status: "cancelled" },
    extend:   { expires_at },
  };
  if (!paymentUpdate[action]) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  // Update payments table
  const { data, error } = await db.from("payments").update(paymentUpdate[action]).eq("id", payment_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Sync tenants table so middleware paywall sees the change immediately ──
  const tenantId = data.tenant_id;
  if (tenantId) {
    if (action === "activate") {
      // Use payment's expires_at, or default to 1 year from now
      const planExpiry = data.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await db.from("tenants").update({
        plan: "pro",
        plan_expires_at: planExpiry,
      }).eq("id", tenantId);
    } else if (action === "extend") {
      await db.from("tenants").update({
        plan: "pro",
        plan_expires_at: expires_at,
      }).eq("id", tenantId);
    } else if (action === "cancel") {
      await db.from("tenants").update({
        plan: "free",
        plan_expires_at: null,
      }).eq("id", tenantId);
    }
  }

  await db.from("admin_audit_logs").insert({
    admin_id: admin.id, admin_email: admin.email,
    action: `SUBSCRIPTION_${action.toUpperCase()}`,
    entity_type: "payment", entity_id: payment_id,
    details: { action, expires_at, tenant_id: tenantId },
  });
  return NextResponse.json(data);
}

/** POST — grant a fresh subscription directly to a tenant (no existing payment needed) */
export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin","admin"].includes(admin.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { tenant_id, expires_at, plan = "pro" } = await req.json();
  if (!tenant_id || !expires_at) return NextResponse.json({ error: "tenant_id and expires_at required" }, { status: 400 });

  const db = getServiceClient();

  // Update tenant plan
  const { error: tenantErr } = await db.from("tenants").update({
    plan,
    plan_expires_at: expires_at,
  }).eq("id", tenant_id);
  if (tenantErr) return NextResponse.json({ error: tenantErr.message }, { status: 500 });

  // Create a payment record for audit trail
  const { data: payment } = await db.from("payments").insert({
    tenant_id,
    status: "paid",
    amount: 0,
    billing_cycle: "admin_grant",
    expires_at,
    created_at: new Date().toISOString(),
  }).select().single();

  await db.from("admin_audit_logs").insert({
    admin_id: admin.id, admin_email: admin.email,
    action: "SUBSCRIPTION_GRANT",
    entity_type: "tenant", entity_id: tenant_id,
    details: { plan, expires_at },
  });

  return NextResponse.json({ ok: true, payment });
}
