import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getRecepciones } from "@/lib/queries/recepciones";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EMPRESA_COLORS, formatDate } from "@/lib/utils";

export default async function RecepcionesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "almacen"].includes(user.rol)) redirect("/dashboard");

  const recepciones = await getRecepciones(user.rol === "admin" ? undefined : user.empresaId);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Recepciones</h2>
          <p className="text-sm text-gray-500">{recepciones.length} registradas</p>
        </div>
        <Link href="/dashboard/recepciones/nueva">
          <Button size="sm">+ Nueva recepción</Button>
        </Link>
      </div>

      <Card>
        {recepciones.length === 0 ? (
          <EmptyState
            title="Sin recepciones"
            description="Registrá recepciones de mercadería contra órdenes de compra emitidas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">OC</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Proveedor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha recep.</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Reclamos</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recepciones.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: EMPRESA_COLORS[r.oc.opi.empresaId] ?? "#6b7280" }}
                        />
                        <span className="font-mono text-xs font-semibold text-gray-900">{r.numero}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/ordenes/${r.oc.id}`} className="text-xs font-mono text-blue-600 hover:underline">
                        {r.oc.numero}
                      </Link>
                      <p className="text-xs text-gray-400">{r.oc.opi.empresa.nombre}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-800 truncate max-w-[160px]">{r.oc.proveedor.nombre}</td>
                    <td className="px-6 py-3"><StatusBadge estado={r.estado} /></td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(r.fechaRecepcion)}</td>
                    <td className="px-6 py-3">
                      {r._count.reclamos > 0 ? (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                          {r._count.reclamos} reclamo{r._count.reclamos !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/recepciones/${r.id}`} className="text-xs text-blue-600 hover:underline font-medium">
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
