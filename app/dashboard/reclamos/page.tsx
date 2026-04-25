import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getReclamos } from "@/lib/queries/reclamos";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { EMPRESA_COLORS, formatDate } from "@/lib/utils";

const RESOLUCION_LABELS: Record<string, string> = {
  reposicion: "Reposición",
  nota_de_credito: "Nota de crédito",
  baja_item: "Baja de ítem",
};

export default async function ReclamosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "almacen", "comprador"].includes(user.rol)) redirect("/dashboard");

  const reclamos = await getReclamos(user.rol === "admin" ? undefined : user.empresaId);

  const abiertos = reclamos.filter((r) => ["abierto", "enviado", "en_negociacion"].includes(r.estado)).length;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reclamos</h2>
        <p className="text-sm text-gray-500">
          {reclamos.length} total · <span className="text-orange-600 font-medium">{abiertos} abiertos</span>
        </p>
      </div>

      {abiertos > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3">
          <p className="text-sm font-semibold text-orange-900">
            {abiertos} reclamo{abiertos !== 1 ? "s" : ""} pendiente{abiertos !== 1 ? "s" : ""} de resolución
          </p>
        </div>
      )}

      <Card>
        {reclamos.length === 0 ? (
          <EmptyState
            title="Sin reclamos"
            description="Los reclamos se generan automáticamente al detectar diferencias en recepciones."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Recepción</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Proveedor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Motivo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Resolución</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reclamos.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: EMPRESA_COLORS[r.recepcion.oc.opi.empresaId] ?? "#6b7280" }}
                        />
                        <span className="font-mono text-xs font-semibold text-gray-900">{r.numero}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/recepciones/${r.recepcion.id}`} className="text-xs font-mono text-blue-600 hover:underline">
                        {r.recepcion.numero}
                      </Link>
                      <p className="text-xs text-gray-400">{r.recepcion.oc.opi.empresa.nombre}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-800 truncate max-w-[140px]">{r.proveedor.nombre}</td>
                    <td className="px-6 py-3 text-gray-700 truncate max-w-[200px] text-xs">{r.motivo}</td>
                    <td className="px-6 py-3"><StatusBadge estado={r.estado} /></td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {r.resolucion ? RESOLUCION_LABELS[r.resolucion] ?? r.resolucion : "—"}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(r.createdAt)}</td>
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/reclamos/${r.id}`} className="text-xs text-blue-600 hover:underline font-medium">
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
