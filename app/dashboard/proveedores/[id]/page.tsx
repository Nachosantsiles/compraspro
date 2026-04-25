import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getProveedorById } from "@/lib/queries/proveedores";
import { ProveedorForm } from "@/components/proveedores/ProveedorForm";
import { ProveedorToggle } from "@/components/proveedores/ProveedorToggle";

export default async function EditarProveedorPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "comprador"].includes(user.rol)) redirect("/dashboard/proveedores");

  const proveedor = await getProveedorById(params.id);
  if (!proveedor) notFound();

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/proveedores" className="text-xs text-gray-500 hover:text-gray-700">
          ← Proveedores
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{proveedor.nombre}</h2>
            <p className="text-sm text-gray-500">
              {proveedor._count.cotizaciones} cotizaciones · {proveedor._count.ordenesCompra} OCs · {proveedor._count.facturas} facturas
            </p>
          </div>
          {user.rol === "admin" && (
            <ProveedorToggle proveedorId={proveedor.id} activo={proveedor.activo} />
          )}
        </div>
      </div>

      <ProveedorForm proveedor={proveedor} />
    </div>
  );
}
