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

  const updateMap: Record<string, any> = {
    activate: { status: "paid" },
    cancel:   { status: "cancelled" },
    extend:   { expires_at },
  };
  if (!updateMap[action]) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { data, error } = await db.from("payments").update(updateMap[action]).eq("id", payment_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("admin_audit_logs").insert({
    admin_id: admin.id, admin_email: admin.email,
    action: `SUBSCRIPTION_${action.toUpperCase()}`,
    entity_type: "payment", entity_id: payment_id,
    details: { action, expires_at },
  });
  return NextResponse.json(data);
}
