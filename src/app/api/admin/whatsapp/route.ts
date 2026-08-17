export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServiceClient();

  const { data: conns, error } = await db
    .from("wa_connections")
    .select("*");

  if (error) {
    console.error("wa_connections error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!conns || conns.length === 0) {
    return NextResponse.json([]);
  }

  const tenantIds = [...new Set(conns.map((c: any) => c.tenant_id).filter(Boolean))];

  const { data: tenants } = tenantIds.length
    ? await db.from("tenants").select("id, email, name").in("id", tenantIds)
    : { data: [] };

  const tm: Record<string, any> = {};
  (tenants || []).forEach((t: any) => { tm[t.id] = t; });

  return NextResponse.json(
    conns.map((c: any) => ({ ...c, user: tm[c.tenant_id] || null }))
  );
}
