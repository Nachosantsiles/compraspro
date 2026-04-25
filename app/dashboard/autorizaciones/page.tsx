import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOPIsPendienteAutFin } from "@/lib/queries/autorizaciones";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { UrgenciaBadge } from "@/components/ui/StatusBadge";
import { EMPRESA_COLORS, formatDate, formatCurrency } from "@/lib/utils";

export default async function AutorizacionesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "finanzas"].includes(user.rol)) redirect("/dashboard");

  const opis = await getOPIsPendienteAutFin(user.empresaId);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Autorización Financiera</h2>
        <p className="text-sm text-gray-500">
          {opis.length} OPI{opis.length !== 1 ? "s" : ""} pendiente{opis.length !== 1 ? "s" : ""} de aprobación
        </p>
      </div>

      {opis.length === 0 ? (
        <Card>
          <EmptyState
            title="Sin pendientes"
            description="No hay OPIs esperando autorización financiera."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {opis.map((opi) => {
            const ganadora = opi.cotizaciones[0];
            return (
              <div
                key={opi.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: EMPRESA_COLORS[opi.empresaId] ?? "#6b7280" }}
                      />
                      <span className="font-mono text-sm font-semibold text-gray-900">{opi.numero}</span>
                      <UrgenciaBadge urgencia={opi.urgencia} />
                      <span className="text-xs text-gray-400">{formatDate(opi.createdAt)}</span>
                    </div>

                    {/* Descripción */}
                    <p className="text-sm text-gray-700 mb-1">{opi.descripcion}</p>
                    <p className="text-xs text-gray-400">
                      {opi.empresa.nombre} · Solicitante: {opi.solicitante} · {opi._count.cotizaciones} cotizaciones
                    </p>

                    {/* Cotización ganadora */}
                    {ganadora && (
                      <div className="mt-3 inline-flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-xs text-purple-600 font-medium">Cotización ganadora</p>
                          <p className="text-sm font-semibold text-purple-900">
                            {ganadora.proveedor.nombre} · {formatCurrency(ganadora.total, ganadora.moneda)}
                          </p>
                          {ganadora.condiciones && (
                            <p className="text-xs text-purple-500">{ganadora.condiciones}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acción */}
                  <Link href={`/dashboard/opis/${opi.id}`} className="flex-shrink-0">
                    <button className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      Revisar y autorizar →
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
