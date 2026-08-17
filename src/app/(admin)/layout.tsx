import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken } from "@/lib/auth";
import Sidebar from "@/components/admin/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("waptrix_admin_token")?.value;
  if (!token) redirect("/login");

  const admin = await verifyAdminToken(token);
  if (!admin) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#EDE8DE]">
      <Sidebar role={admin.role} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
