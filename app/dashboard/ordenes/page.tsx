import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrdenes } from "@/lib/queries/ordenes";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { EMPRESA_COLORS, formatDate, formatCurrency } from "@/lib/utils";

export default async function OrdenesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "comprador", "finanzas"].includes(user.rol)) redirect("/dashboard");

  const ordenes = await getOrdenes(user.rol === "admin" ? undefined : user.empresaId);

  const byEstado = {
    borrador: ordenes.filter((o) => o.estado === "borrador").length,
    emitida: ordenes.filter((o) => o.estado === "emitida").length,
    recibida_parcial: ordenes.filter((o) => o.estado === "recibida_parcial").length,
    recibida: ordenes.filter((o) => o.estado === "recibida").length,
    cancelada: ordenes.filter((o) => o.estado === "cancelada").length,
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Órdenes de Compra</h2>
        <p className="text-sm text-gray-500">{ordenes.length} en total</p>
      </div>

      {/* Resumen por estado */}
      {ordenes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { key: "borrador", label: "Borradores", color: "bg-gray-100 text-gray-700" },
            { key: "emitida", label: "Emitidas", color: "bg-blue-100 text-blue-800" },
            { key: "recibida_parcial", label: "Rec. Parcial", color: "bg-amber-100 text-amber-800" },
            { key: "recibida", label: "Recibidas", color: "bg-green-100 text-green-800" },
            { key: "cancelada", label: "Canceladas", color: "bg-red-100 text-red-800" },
          ].map(({ key, label, color }) => (
            <div key={key} className={`rounded-xl px-4 py-3 text-center ${color}`}>
              <p className="text-2xl font-bold">{byEstado[key as keyof typeof byEstado]}</p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        {ordenes.length === 0 ? (
          <EmptyState
            title="Sin órdenes de compra"
            description="Las OCs se generan automáticamente al aprobar una autorización financiera."
          />
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
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ordenes.map((oc) => (
                  <tr key={oc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: EMPRESA_COLORS[oc.opi.empresaId] ?? "#6b7280" }}
                        />
                        <span className="font-mono text-xs font-semibold text-gray-900">{oc.numero}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/opis/${oc.opi.id}`} className="text-xs font-mono text-blue-600 hover:underline">
                        {oc.opi.numero}
                      </Link>
                      <p className="text-xs text-gray-400">{oc.opi.empresa.nombre}</p>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-gray-800 truncate max-w-[180px]">{oc.proveedor.nombre}</p>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(oc.total, oc.moneda)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge estado={oc.estado} />
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(oc.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/dashboard/ordenes/${oc.id}`}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Ver →
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
