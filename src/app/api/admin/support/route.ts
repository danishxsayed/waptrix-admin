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
  let q = db.from("support_tickets").select("*, replies:support_ticket_replies(count)").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return NextResponse.json(data||[]);
}

export async function PATCH(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ticket_id, status, reply } = await req.json();
  const db = getServiceClient();
  if (status) {
    await db.from("support_tickets").update({ status, resolved_at: status==="resolved" ? new Date().toISOString() : null, assigned_to: admin.id }).eq("id", ticket_id);
  }
  if (reply) {
    await db.from("support_ticket_replies").insert({ ticket_id, admin_id: admin.id, is_admin: true, content: reply });
  }
  await db.from("admin_audit_logs").insert({
    admin_id: admin.id, admin_email: admin.email, action: "SUPPORT_TICKET_UPDATE",
    entity_type: "ticket", entity_id: ticket_id, details: { status, has_reply: !!reply }
  });
  return NextResponse.json({ ok: true });
}
