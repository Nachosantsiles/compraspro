import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCotizaciones, getOPIsParaCotizar } from "@/lib/queries/cotizaciones";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EMPRESA_COLORS, formatDate, formatCurrency } from "@/lib/utils";

export default async function CotizacionesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  const canCreate = ["admin", "comprador"].includes(user.rol);

  const [cotizaciones, opisPendientes] = await Promise.all([
    getCotizaciones(),
    getOPIsParaCotizar(user.empresaId),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cotizaciones</h2>
          <p className="text-sm text-gray-500">{cotizaciones.length} registradas</p>
        </div>
      </div>

      {/* OPIs que necesitan cotización */}
      {canCreate && opisPendientes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-900 mb-3">
            OPIs que requieren cotización ({opisPendientes.length})
          </p>
          <div className="space-y-2">
            {opisPendientes.map((opi) => (
              <div key={opi.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-amber-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: EMPRESA_COLORS[opi.empresaId] ?? "#6b7280" }}
                  />
                  <div>
                    <span className="text-xs font-mono text-gray-500">{opi.numero}</span>
                    <p className="text-sm text-gray-800 truncate max-w-[300px]">{opi.descripcion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-600">
                    {opi._count.cotizaciones} cot{opi._count.cotizaciones !== 1 ? "s." : "."}
                  </span>
                  <Link href={`/dashboard/cotizaciones/nueva?opiId=${opi.id}`}>
                    <Button size="sm">+ Cotización</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de cotizaciones */}
      <Card>
        {cotizaciones.length === 0 ? (
          <EmptyState title="Sin cotizaciones" description="Aún no se registraron cotizaciones." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">OPI</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Proveedor</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cotizaciones.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs text-gray-600">{c.numero}</span>
                      {c.seleccionada && (
                        <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                          ✓ Ganadora
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/opis/${c.opi.id}`} className="text-xs font-mono text-blue-600 hover:underline">
                        {c.opi.numero}
                      </Link>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">{c.opi.descripcion}</p>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-gray-800 truncate max-w-[160px]">{c.proveedor.nombre}</p>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(c.total, c.moneda)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge estado={c.estado} />
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(c.createdAt)}
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
