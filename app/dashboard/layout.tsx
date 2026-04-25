import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import type { RolEnum } from "@/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;

  return (
    <AppShell
      rol={user.rol as RolEnum}
      userName={user.name ?? ""}
      empresaNombre={user.empresaNombre}
      empresaColor={user.empresaColor}
    >
      {children}
    </AppShell>
  );
}
