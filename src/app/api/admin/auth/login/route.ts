export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceClient } from "@/lib/supabase";
import { signAdminToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const db = getServiceClient();
    const { data: admin, error } = await db
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !admin) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    // Log login
    await db.from("admin_audit_logs").insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action: "LOGIN",
      entity_type: "session",
      details: { ip: req.headers.get("x-forwarded-for") || "unknown" },
    });

    const token = await signAdminToken({ id: admin.id, email: admin.email, role: admin.role, name: admin.name });

    const res = NextResponse.json({ ok: true, admin: { id: admin.id, email: admin.email, role: admin.role, name: admin.name } });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12, // 12h
      path: "/",
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
