import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProveedores } from "@/lib/queries/proveedores";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default async function ProveedoresPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "comprador"].includes(user.rol)) redirect("/dashboard");

  const proveedores = await getProveedores();
  const activos = proveedores.filter((p) => p.activo).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Proveedores</h2>
          <p className="text-sm text-gray-500">{activos} activos · {proveedores.length - activos} inactivos</p>
        </div>
        <Link href="/dashboard/proveedores/nuevo">
          <Button size="sm">+ Nuevo proveedor</Button>
        </Link>
      </div>

      <Card>
        {proveedores.length === 0 ? (
          <EmptyState title="Sin proveedores" description="Agregá proveedores para cotizar y generar órdenes de compra." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">CUIT</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Contacto</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Cotiz.</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">OCs</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {proveedores.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.activo ? "opacity-50" : ""}`}>
                    <td className="px-6 py-3">
                      <p className="font-semibold text-gray-900">{p.nombre}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-600 font-mono text-xs">{p.cuit ?? "—"}</td>
                    <td className="px-6 py-3">
                      {p.email && <p className="text-xs text-gray-600">{p.email}</p>}
                      {p.telefono && <p className="text-xs text-gray-400">{p.telefono}</p>}
                      {!p.email && !p.telefono && <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-700 font-medium">{p._count.cotizaciones}</td>
                    <td className="px-6 py-3 text-right text-gray-700 font-medium">{p._count.ordenesCompra}</td>
                    <td className="px-6 py-3">
                      {p.activo
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Activo</span>
                        : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactivo</span>}
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/proveedores/${p.id}`} className="text-xs text-blue-600 hover:underline font-medium">
                        Editar →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
