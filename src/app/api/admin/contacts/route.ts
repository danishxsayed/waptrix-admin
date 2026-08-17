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
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 25;

  let q = db.from("contacts").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  const { data, count } = await q.range((page-1)*limit, page*limit-1);

  // Join tenant emails
  const tenantIds = [...new Set((data||[]).map((d:any)=>d.tenant_id).filter(Boolean))];
  const { data: tenants } = tenantIds.length
    ? await db.from("tenants").select("id,email,name").in("id", tenantIds)
    : { data: [] };
  const tm: Record<string,any> = {};
  (tenants||[]).forEach((t:any) => { tm[t.id] = t; });

  return NextResponse.json({
    data: (data||[]).map((d:any) => ({ ...d, tenant: tm[d.tenant_id] || null })),
    total: count || 0
  });
}
