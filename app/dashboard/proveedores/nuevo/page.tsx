import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProveedorForm } from "@/components/proveedores/ProveedorForm";

export default async function NuevoProveedorPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "comprador"].includes(user.rol)) redirect("/dashboard/proveedores");

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/proveedores" className="text-xs text-gray-500 hover:text-gray-700">
          ← Proveedores
        </Link>
        <h2 className="text-xl font-bold text-gray-900 mt-2">Nuevo proveedor</h2>
        <p className="text-sm text-gray-500">Ingresá los datos del proveedor</p>
      </div>
      <ProveedorForm />
    </div>
  );
}
