import { AdminAuthProvider } from "@/lib/adminAuthClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <div className="min-h-screen bg-[var(--bg)]">{children}</div>
    </AdminAuthProvider>
  );
}
