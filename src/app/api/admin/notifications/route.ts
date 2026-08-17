export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getServiceClient();
  const { data } = await db.from("platform_notifications").select("*, admin:admin_id(name,email)").order("created_at", { ascending: false }).limit(100);
  return NextResponse.json(data||[]);
}

export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title, message, type, target, tenant_id } = await req.json();
  if (!title || !message) return NextResponse.json({ error: "Title and message required" }, { status: 400 });
  const db = getServiceClient();
  const { data, error } = await db.from("platform_notifications").insert({
    admin_id: admin.id, title, message, type: type||"info", target: target||"all", tenant_id: tenant_id||null
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await db.from("admin_audit_logs").insert({
    admin_id: admin.id, admin_email: admin.email, action: "NOTIFICATION_SENT",
    entity_type: "notification", entity_id: data.id, details: { title, target }
  });
  return NextResponse.json(data);
}
