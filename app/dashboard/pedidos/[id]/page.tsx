import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getPedidoById } from "@/lib/queries/pedidos";
import { AutecPanel } from "@/components/pedidos/AutecPanel";
import { StatusBadge, UrgenciaBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EMPRESA_COLORS, formatDate } from "@/lib/utils";
import type { RolEnum } from "@/types";

export default async function PedidoDetallePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  const rol = user.rol as RolEnum;

  const pedido = await getPedidoById(params.id);
  if (!pedido) notFound();

  const canAutec = ["admin", "tecnico"].includes(rol);

  const ccLabel = pedido.centroCosto
    ? `${pedido.centroCosto.departamento.codigo} › ${pedido.centroCosto.codigo} – ${pedido.centroCosto.descripcion}`
    : pedido.centroCostoFinca
    ? `${pedido.centroCostoFinca.tipo} › ${pedido.centroCostoFinca.categoria}${pedido.centroCostoFinca.subcategoria ? ` › ${pedido.centroCostoFinca.subcategoria}` : ""}`
    : "—";

  // Mapa de decisiones por ítem para la tabla
  const decMap = new Map(
    (pedido.autTecnica?.itemsAutTec ?? []).map((d) => [d.itemPedidoId, d])
  );
  const esAutecParcial = pedido.autTecnica?.estado === "aprobada_parcial";

  return (
    <div className="p-6 max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/pedidos" className="text-xs text-gray-500 hover:text-gray-700">
            ← Pedidos
          </Link>
          <h2 className="text-xl font-bold text-gray-900 mt-1 font-mono">{pedido.numero}</h2>
        </div>
        <div className="flex items-center gap-2">
          <UrgenciaBadge urgencia={pedido.urgencia} />
          <StatusBadge estado={pedido.estado} />
        </div>
      </div>

      {/* OPI vinculada — generada automáticamente al aprobar autec */}
      {pedido.opi && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-teal-900">OPI generada automáticamente</p>
            <p className="text-xs text-teal-700 mt-0.5">
              <span className="font-mono">{pedido.opi.numero}</span> · <StatusBadge estado={pedido.opi.estado} />
            </p>
          </div>
          <Link href={`/dashboard/opis/${pedido.opi.id}`}>
            <Button size="sm" variant="outline">Ver OPI</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Datos principales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Datos del pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Empresa</p>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: EMPRESA_COLORS[pedido.empresaId] ?? "#6b7280" }}
                  />
                  <span className="font-medium text-gray-800">{pedido.empresa.nombre}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Solicitante</p>
                <p className="font-medium text-gray-800">{pedido.solicitante}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Imputación</p>
                <p className="text-gray-700 text-xs">{ccLabel}</p>
              </div>
              {pedido.finca && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Finca</p>
                  <p className="text-gray-700">{pedido.finca.nombre}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Fecha</p>
                <p className="text-gray-700">{formatDate(pedido.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Creado por</p>
                <p className="text-gray-700">
                  {pedido.creador.nombre} {pedido.creador.apellido}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Descripción</p>
              <p className="text-gray-800 text-sm">{pedido.descripcion}</p>
            </div>
          </CardContent>
        </Card>

        {/* Autec */}
        <div className="space-y-4">
          {pedido.autTecnica && (
            <AutecPanel
              pedidoId={pedido.id}
              estado={pedido.autTecnica.estado}
              aprobador={pedido.autTecnica.aprobador}
              fecha={pedido.autTecnica.fecha}
              comentario={pedido.autTecnica.comentario}
              canAct={canAutec}
              items={pedido.items}
              itemsAutTec={pedido.autTecnica.itemsAutTec}
            />
          )}
        </div>
      </div>

      {/* Ítems */}
      <Card>
        <CardHeader>
          <CardTitle>Ítems solicitados ({pedido.items.length})</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Cant.</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Presentación</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Unidad</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Subcategoría</th>
                {esAutecParcial && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Autec</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pedido.items.map((item) => {
                const dec = decMap.get(item.id);
                return (
                  <tr
                    key={item.id}
                    className={
                      dec?.estado === "denegado"  ? "bg-red-50/50" :
                      dec?.estado === "modificado" ? "bg-amber-50/50" : ""
                    }
                  >
                    <td className="px-6 py-3 text-gray-400">{item.orden + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">{item.cantidad}</td>
                    <td className="px-6 py-3 text-gray-800">{item.presentacion}</td>
                    <td className="px-6 py-3 text-gray-600">{item.unidadMedida}</td>
                    <td className="px-6 py-3 text-gray-700">{item.categoria.nombre}</td>
                    <td className="px-6 py-3 text-gray-600">{item.subCategoria.nombre}</td>
                    {esAutecParcial && (
                      <td className="px-6 py-3">
                        {!dec || dec.estado === "ok" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            ✓ OK
                          </span>
                        ) : dec.estado === "denegado" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            ✗ Denegado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            ✏ → {dec.nuevaCantidad} {item.unidadMedida}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
