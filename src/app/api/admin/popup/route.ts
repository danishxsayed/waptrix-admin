export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServiceClient();
  const { data } = await db.from("popup_config").select("*").eq("id", 1).single();
  return NextResponse.json(data || { id: 1, enabled: false, image_url: null, link_url: "/pricing" });
}

export async function PUT(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { enabled, image_url, link_url } = body;

  const db = getServiceClient();
  const { data, error } = await db
    .from("popup_config")
    .upsert({ id: 1, enabled: !!enabled, image_url: image_url || null, link_url: link_url || "/pricing", updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("admin_audit_logs").insert({
    admin_id: admin.id, admin_email: admin.email,
    action: "POPUP_UPDATED", entity_type: "popup",
    details: { enabled, image_url, link_url },
  });

  return NextResponse.json(data);
}
