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
  let q = db.from("campaigns").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (search) q = q.ilike("name", `%${search}%`);
  const { data, count } = await q.range((page-1)*limit, page*limit-1);
  const tenantIds = [...new Set((data||[]).map((d:any)=>d.tenant_id))];
  const { data: profiles } = await db.from("tenants").select("id,email,name").in("id", tenantIds);
  const pm: Record<string,any> = {};
  (profiles||[]).forEach((p:any)=>{pm[p.id]=p;});
  return NextResponse.json({ data: (data||[]).map((d:any)=>({...d,user:pm[d.tenant_id]||null})), total: count||0 });
}
