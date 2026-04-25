import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getEmpresas } from "@/lib/queries/usuarios";
import { UsuarioForm } from "@/components/usuarios/UsuarioForm";

export default async function NuevoUsuarioPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.rol !== "admin") redirect("/dashboard/usuarios");

  const empresas = await getEmpresas();

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/usuarios" className="text-xs text-gray-500 hover:text-gray-700">
          ← Usuarios
        </Link>
        <h2 className="text-xl font-bold text-gray-900 mt-2">Nuevo usuario</h2>
        <p className="text-sm text-gray-500">Creá un usuario para dar acceso al sistema</p>
      </div>
      <UsuarioForm empresas={empresas} />
    </div>
  );
}
