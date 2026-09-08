export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext    = file.name.split(".").pop() || "png";
    const path   = `popup/offer-${Date.now()}.${ext}`;

    const db = getServiceClient();
    const { error: uploadError } = await db.storage
      .from("media")
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: { publicUrl } } = db.storage.from("media").getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
