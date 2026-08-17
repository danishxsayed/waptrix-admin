export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServiceClient();

  const [
    { count: totalUsers },
    { count: totalContacts },
    { count: totalCampaigns },
    { count: totalTemplates },
    { count: activeWA },
    { data: payments },
    { data: campaigns },
    { data: recentTenants },
    { data: recentPayments },
  ] = await Promise.all([
    db.from("tenants").select("*", { count: "exact", head: true }),
    db.from("contacts").select("*", { count: "exact", head: true }),
    db.from("campaigns").select("*", { count: "exact", head: true }),
    db.from("templates").select("*", { count: "exact", head: true }),
    db.from("wa_connections").select("*", { count: "exact", head: true }).not("waba_id", "is", null).neq("waba_id", "pending"),
    db.from("payments").select("amount, status, created_at").order("created_at", { ascending: false }).limit(200),
    db.from("campaigns").select("sent_count, delivered_count, failed_count, read_count"),
    db.from("tenants").select("id, name, email, plan, created_at").order("created_at", { ascending: false }).limit(5),
    db.from("payments").select("amount, status, tenant_id, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  // support_tickets may not exist yet — query separately with fallback
  let openTickets = 0;
  try {
    const { count } = await db.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open");
    openTickets = count ?? 0;
  } catch {}

  const successPayments = (payments ?? []).filter((p: any) => p.status === "paid");
  const totalRevenue = successPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
  const monthRevenue = successPayments
    .filter((p: any) => new Date(p.created_at) >= thisMonth)
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  let totalSent = 0, totalDelivered = 0, totalFailed = 0, totalRead = 0;
  (campaigns ?? []).forEach((c: any) => {
    totalSent      += Number(c.sent_count)      || 0;
    totalDelivered += Number(c.delivered_count) || 0;
    totalFailed    += Number(c.failed_count)    || 0;
    totalRead      += Number(c.read_count)      || 0;
  });

  // Revenue chart — last 7 days
  const revenueChart: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    revenueChart[d.toISOString().slice(0,10)] = 0;
  }
  successPayments.forEach((p: any) => {
    const day = p.created_at?.slice(0,10);
    if (day && day in revenueChart) revenueChart[day] += Number(p.amount || 0);
  });

  return NextResponse.json({
    stats: {
      totalUsers:     totalUsers     ?? 0,
      totalContacts:  totalContacts  ?? 0,
      totalCampaigns: totalCampaigns ?? 0,
      totalTemplates: totalTemplates ?? 0,
      activeWA:       activeWA       ?? 0,
      totalRevenue, monthRevenue,
      totalSent, totalDelivered, totalFailed, totalRead,
      openTickets,
      deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
    },
    chartData: Object.entries(revenueChart).map(([date, revenue]) => ({ date, revenue })),
    recentUsers:    recentTenants   ?? [],
    recentPayments: recentPayments  ?? [],
  });
}
