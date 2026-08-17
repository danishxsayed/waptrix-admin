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
  const limit = 25;

  let q = db.from("payments").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  if (search) q = q.or(`order_id.ilike.%${search}%,cf_order_id.ilike.%${search}%`);
  const { data, count } = await q.range((page-1)*limit, page*limit-1);

  const tenantIds = [...new Set((data||[]).map((d:any)=>d.tenant_id))];
  const { data: profiles } = await db.from("tenants").select("id,email,name").in("id", tenantIds);
  const pm: Record<string,any> = {};
  (profiles||[]).forEach((p:any) => { pm[p.id] = p; });

  // Revenue summary
  const { data: allPaid } = await db.from("payments").select("amount").eq("status","paid");
  const totalRevenue = (allPaid||[]).reduce((s:number,p:any)=>s+Number(p.amount||0),0);

  const today = new Date(); today.setHours(0,0,0,0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const { data: monthPaid } = await db.from("payments").select("amount").eq("status","paid").gte("created_at", monthStart.toISOString());
  const monthRevenue = (monthPaid||[]).reduce((s:number,p:any)=>s+Number(p.amount||0),0);

  return NextResponse.json({
    data: (data||[]).map((d:any)=>({...d, user: pm[d.tenant_id]||null})),
    total: count||0,
    summary: { totalRevenue, monthRevenue },
  });
}
