export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL     = "Waptrix <no-reply@waptrix.in>";
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL || "https://app.waptrix.in";

function buildEmailHtml(title: string, message: string, type: string) {
  const accent  = type === "warning" ? "#F59E0B" : type === "error" ? "#EF4444" : "#10B981";
  const emoji   = type === "warning" ? "⚠️" : type === "error" ? "🚨" : "📢";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #E2E8F0;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="padding:28px 40px 24px;background:#ffffff;text-align:center;border-bottom:1px solid #E2E8F0;">
            <div style="background:#10B981;color:#fff;width:34px;height:34px;border-radius:9px;text-align:center;line-height:34px;font-weight:900;font-size:19px;display:inline-block;">W</div>
            <span style="color:#0F172A;font-size:19px;font-weight:800;letter-spacing:-0.4px;vertical-align:middle;margin-left:9px;">Waptrix</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;text-align:center;">
            <div style="font-size:40px;margin-bottom:16px;">${emoji}</div>
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0F172A;">${title}</h1>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px 24px;text-align:left;margin-bottom:28px;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;white-space:pre-wrap;">${message}</p>
            </div>
            <a href="${APP_URL}" style="display:inline-block;background:${accent};color:#fff;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;">Go to Dashboard →</a>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 40px;text-align:center;background:#F8FAFC;border-top:1px solid #E2E8F0;">
            <p style="margin:0 0 3px;font-size:13px;color:#10B981;font-weight:700;">Waptrix</p>
            <p style="margin:0;font-size:11px;color:#94A3B8;">WhatsApp Marketing Platform</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
}

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

  // Save to DB
  const { data, error } = await db.from("platform_notifications").insert({
    admin_id: admin.id, title, message, type: type||"info", target: target||"all", tenant_id: tenant_id||null
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch recipient emails
  let emails: string[] = [];
  if (target === "specific" && tenant_id) {
    const { data: tenant } = await db.from("tenants").select("email").eq("id", tenant_id).single();
    if (tenant?.email) emails = [tenant.email];
  } else {
    // All active tenants
    const { data: tenants } = await db.from("tenants").select("email").not("email", "is", null);
    emails = (tenants || []).map((t: any) => t.email).filter(Boolean);
  }

  // Send emails (batched to avoid Resend rate limits)
  const html    = buildEmailHtml(title, message, type || "info");
  const subject = `[Waptrix] ${title}`;
  const BATCH   = 50;
  for (let i = 0; i < emails.length; i += BATCH) {
    await Promise.allSettled(emails.slice(i, i + BATCH).map(email => sendEmail(email, subject, html)));
  }

  await db.from("admin_audit_logs").insert({
    admin_id: admin.id, admin_email: admin.email, action: "NOTIFICATION_SENT",
    entity_type: "notification", entity_id: data.id,
    details: { title, target, recipients: emails.length }
  });

  return NextResponse.json({ ...data, emails_sent: emails.length });
}
