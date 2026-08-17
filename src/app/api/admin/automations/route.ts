export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getServiceClient();
  const { data } = await db.from("automations").select("*").order("created_at", { ascending: false });
  const tenantIds = [...new Set((data||[]).map((d:any)=>d.tenant_id))];
  const { data: profiles } = await db.from("tenants").select("id,email,name").in("id", tenantIds);
  const pm: Record<string,any> = {};
  (profiles||[]).forEach((p:any)=>{pm[p.id]=p;});
  return NextResponse.json((data||[]).map((d:any)=>({...d,user:pm[d.tenant_id]||null})));
}
