export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getServiceClient();
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 50;
  let q = db.from("message_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, count } = await q.range((page-1)*limit, page*limit-1);
  return NextResponse.json({ data: data||[], total: count||0 });
}
