import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getRecepcionById } from "@/lib/queries/recepciones";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EMPRESA_COLORS, formatDate, formatCurrency } from "@/lib/utils";
import type { RolEnum } from "@/types";

export default async function RecepcionDetallePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  const rol = user.rol as RolEnum;

  const recepcion = await getRecepcionById(params.id);
  if (!recepcion) notFound();

  return (
    <div className="p-6 max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/recepciones" className="text-xs text-gray-500 hover:text-gray-700">
            ← Recepciones
          </Link>
          <h2 className="text-xl font-bold text-gray-900 mt-1 font-mono">{recepcion.numero}</h2>
        </div>
        <StatusBadge estado={recepcion.estado} />
      </div>

      {/* Alerta diferencias */}
      {recepcion.estado === "con_diferencias" && recepcion.reclamos.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-orange-900">
            Se generaron {recepcion.reclamos.length} reclamo{recepcion.reclamos.length !== 1 ? "s" : ""} por diferencias en esta recepción
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {recepcion.reclamos.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/reclamos/${r.id}`}
                className="text-xs font-mono bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200 transition-colors"
              >
                {r.numero} →
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Datos de la recepción</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Empresa</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EMPRESA_COLORS[recepcion.oc.opi.empresaId] ?? "#6b7280" }} />
                <span className="font-medium">{recepcion.oc.opi.empresa.nombre}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">OC</p>
              <Link href={`/dashboard/ordenes/${recepcion.oc.id}`} className="font-mono text-sm text-blue-600 hover:underline">
                {recepcion.oc.numero}
              </Link>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Proveedor</p>
              <p className="font-medium">{recepcion.oc.proveedor.nombre}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Fecha recepción</p>
              <p>{formatDate(recepcion.fechaRecepcion)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Registrada</p>
              <p>{formatDate(recepcion.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Registrada por</p>
              <p>{recepcion.creador.nombre} {recepcion.creador.apellido}</p>
            </div>
            {recepcion.observaciones && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-0.5">Observaciones</p>
                <p className="text-gray-600 italic text-sm">{recepcion.observaciones}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Ítems</span>
                <span className="font-medium">{recepcion.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Con diferencias</span>
                <span className={`font-medium ${recepcion.items.filter(i => i.estado !== "ok").length > 0 ? "text-orange-600" : "text-green-600"}`}>
                  {recepcion.items.filter(i => i.estado !== "ok").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reclamos</span>
                <span className="font-medium">{recepcion.reclamos.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Items */}
      <Card>
        <CardHeader><CardTitle>Ítems recibidos ({recepcion.items.length})</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Pedido</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Recibido</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Diferencia</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recepcion.items.map((item) => (
                <tr key={item.id} className={item.estado !== "ok" ? "bg-orange-50/40" : ""}>
                  <td className="px-6 py-3 text-gray-800">{item.itemOC.descripcion}</td>
                  <td className="px-6 py-3 text-right font-medium">{item.cantPedida} {item.itemOC.unidadMedida}</td>
                  <td className="px-6 py-3 text-right font-medium">{item.cantRecibida}</td>
                  <td className={`px-6 py-3 text-right font-medium ${item.diferencia < 0 ? "text-red-600" : item.diferencia > 0 ? "text-amber-600" : "text-green-600"}`}>
                    {item.diferencia > 0 ? "+" : ""}{item.diferencia}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {item.estado === "ok"
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">OK</span>
                      : item.estado === "faltante"
                      ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Faltante</span>
                      : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Exceso</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reclamos */}
      {recepcion.reclamos.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Reclamos generados ({recepcion.reclamos.length})</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Motivo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Resolución</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recepcion.reclamos.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-3 font-mono text-xs">{r.numero}</td>
                    <td className="px-6 py-3 text-gray-700 text-xs max-w-[280px] truncate">{r.motivo}</td>
                    <td className="px-6 py-3"><StatusBadge estado={r.estado} /></td>
                    <td className="px-6 py-3 text-xs text-gray-500">{r.resolucion ?? "—"}</td>
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/reclamos/${r.id}`} className="text-xs text-blue-600 hover:underline">Ver →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
