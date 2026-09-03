import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";

export async function requireAdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");
  try {
    const payload = verifyAccessToken(token);
    if (payload.role !== "admin") redirect("/admin/login");
    return payload;
  } catch {
    redirect("/admin/login");
  }
}
