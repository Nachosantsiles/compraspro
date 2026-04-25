import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getFacturas } from "@/lib/queries/facturas";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EMPRESA_COLORS, formatDate, formatCurrency } from "@/lib/utils";

export default async function FacturasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "finanzas"].includes(user.rol)) redirect("/dashboard");

  const facturas = await getFacturas(user.rol === "admin" ? undefined : user.empresaId);

  const totalPendiente = facturas
    .filter((f) => ["pendiente", "vencida", "pagada_parcial"].includes(f.estado))
    .reduce((acc, f) => acc + f.total, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Facturas</h2>
          <p className="text-sm text-gray-500">{facturas.length} registradas</p>
        </div>
        <Link href="/dashboard/facturas/nueva">
          <Button size="sm">+ Nueva factura</Button>
        </Link>
      </div>

      {/* Resumen */}
      {facturas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Pendientes", estados: ["pendiente"], color: "bg-yellow-100 text-yellow-800" },
            { label: "Vencidas", estados: ["vencida"], color: "bg-red-100 text-red-800" },
            { label: "Pago parcial", estados: ["pagada_parcial"], color: "bg-amber-100 text-amber-800" },
            { label: "Pagadas", estados: ["pagada"], color: "bg-green-100 text-green-800" },
          ].map(({ label, estados, color }) => (
            <div key={label} className={`rounded-xl px-4 py-3 text-center ${color}`}>
              <p className="text-2xl font-bold">
                {facturas.filter((f) => estados.includes(f.estado)).length}
              </p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {totalPendiente > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-amber-900">
            Total a pagar: <span className="font-bold">{formatCurrency(totalPendiente)}</span>
          </p>
          <Link href="/dashboard/pagos/nuevo">
            <Button size="sm">Registrar pago</Button>
          </Link>
        </div>
      )}

      <Card>
        {facturas.length === 0 ? (
          <EmptyState title="Sin facturas" description="Registrá facturas asociadas a órdenes de compra emitidas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">OC</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Proveedor</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Emisión</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Vto.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {facturas.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: EMPRESA_COLORS[f.oc.opi.empresaId] ?? "#6b7280" }}
                        />
                        <span className="font-mono text-xs font-semibold">{f.numero}</span>
                        <span className="text-xs text-gray-400">({f.tipo})</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/ordenes/${f.oc.id}`} className="text-xs font-mono text-blue-600 hover:underline">
                        {f.oc.numero}
                      </Link>
                      <p className="text-xs text-gray-400">{f.oc.opi.empresa.nombre}</p>
                    </td>
                    <td className="px-6 py-3 truncate max-w-[160px] text-gray-800">{f.proveedor.nombre}</td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(f.total, f.moneda)}
                    </td>
                    <td className="px-6 py-3"><StatusBadge estado={f.estado} /></td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(f.fechaEmision)}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {f.fechaVto
                        ? <span className={new Date(f.fechaVto) < new Date() && f.estado !== "pagada" ? "text-red-600 font-medium" : ""}>
                            {formatDate(f.fechaVto)}
                          </span>
                        : "—"}
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
