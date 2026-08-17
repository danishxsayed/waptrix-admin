export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["super_admin","admin"].includes(admin.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Return sanitized config (no secrets)
  return NextResponse.json({
    app_url: process.env.NEXT_PUBLIC_APP_URL || "",
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    has_service_key: !!process.env.SUPABASE_SERVICE_KEY,
    has_jwt_secret: !!process.env.ADMIN_JWT_SECRET,
    node_env: process.env.NODE_ENV || "development",
  });
}
