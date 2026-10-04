export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db  = getServiceClient();
  const url = new URL(req.url);
  const search  = url.searchParams.get("search") || "";
  const filter  = url.searchParams.get("filter") || "all"; // all | onboarded | trial | expired
  const page    = parseInt(url.searchParams.get("page") || "1");
  const limit   = 25;
  const offset  = (page - 1) * limit;

  let q = db
    .from("tenants")
    .select(
      "id, name, email, phone, is_whatsapp, preferred_contact, company, industry, role, team_size, use_cases, msg_volume, referral_source, onboarding_done, plan, trial_ends_at, plan_expires_at, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (search) {
    q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  if (filter === "onboarded") q = q.eq("onboarding_done", true);
  if (filter === "trial") q = q.eq("plan", "trial");
  if (filter === "expired") {
    q = q.eq("plan", "trial").lt("trial_ends_at", new Date().toISOString());
  }

  const { data, count, error } = await q.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ leads: data || [], total: count || 0 });
}
