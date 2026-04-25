import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getOrdenById } from "@/lib/queries/ordenes";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { OrdenActions } from "@/components/ordenes/OrdenActions";
import { EMPRESA_COLORS, formatDate, formatCurrency } from "@/lib/utils";
import type { RolEnum } from "@/types";

export default async function OrdenDetallePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  const rol = user.rol as RolEnum;

  const oc = await getOrdenById(params.id);
  if (!oc) notFound();

  const canEmitir = ["admin", "comprador"].includes(rol) && oc.estado === "borrador";
  const canCancelar = rol === "admin" && !["recibida", "cancelada"].includes(oc.estado);

  const progresoPct = oc.total > 0
    ? Math.round((oc.items.reduce((acc, i) => acc + i.cantRecibida * i.precioUnitario, 0) / oc.total) * 100)
    : 0;

  return (
    <div className="p-6 max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/ordenes" className="text-xs text-gray-500 hover:text-gray-700">
            ← Órdenes de Compra
          </Link>
          <h2 className="text-xl font-bold text-gray-900 mt-1 font-mono">{oc.numero}</h2>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge estado={oc.estado} />
        </div>
      </div>

      {/* Acciones */}
      {(canEmitir || canCancelar) && (
        <OrdenActions ocId={oc.id} ocNumero={oc.numero} canEmitir={canEmitir} canCancelar={canCancelar} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Datos principales */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Datos de la OC</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Empresa</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EMPRESA_COLORS[oc.opi.empresaId] ?? "#6b7280" }} />
                  <span className="font-medium text-gray-800">{oc.opi.empresa.nombre}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Proveedor</p>
                <p className="font-medium text-gray-800">{oc.proveedor.nombre}</p>
                {oc.proveedor.cuit && <p className="text-xs text-gray-400">CUIT {oc.proveedor.cuit}</p>}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">OPI Origen</p>
                <Link href={`/dashboard/opis/${oc.opi.id}`} className="text-sm font-mono text-blue-600 hover:underline">
                  {oc.opi.numero}
                </Link>
                <p className="text-xs text-gray-400 truncate max-w-[200px]">{oc.opi.descripcion}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Solicitante</p>
                <p className="text-gray-700">{oc.opi.solicitante}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Creada</p>
                <p className="text-gray-700">{formatDate(oc.createdAt)}</p>
              </div>
              {oc.emitidaAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Emitida</p>
                  <p className="text-gray-700">{formatDate(oc.emitidaAt)}</p>
                </div>
              )}
              {oc.condiciones && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-0.5">Condiciones de pago</p>
                  <p className="text-gray-700">{oc.condiciones}</p>
                </div>
              )}
              {oc.plazoEntrega && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Plazo de entrega</p>
                  <p className="text-gray-700">{oc.plazoEntrega}</p>
                </div>
              )}
            </div>
            {oc.observaciones && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Observaciones</p>
                <p className="text-gray-600 text-sm italic">{oc.observaciones}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen derecho */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Moneda</span>
                <span className="font-medium">{oc.moneda}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total OC</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(oc.total, oc.moneda)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ítems</span>
                <span className="font-medium">{oc.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Facturas</span>
                <span className="font-medium">{oc.facturas.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Recepciones</span>
                <span className="font-medium">{oc.recepciones.length}</span>
              </div>

              {/* Barra de recepción */}
              {oc.estado !== "borrador" && (
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Recepción</span>
                    <span>{progresoPct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${progresoPct}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proveedor contacto */}
          {(oc.proveedor.email || oc.proveedor.telefono || oc.proveedor.direccion) && (
            <Card>
              <CardHeader><CardTitle>Contacto proveedor</CardTitle></CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                {oc.proveedor.email && (
                  <p className="text-gray-600 text-xs">{oc.proveedor.email}</p>
                )}
                {oc.proveedor.telefono && (
                  <p className="text-gray-600 text-xs">{oc.proveedor.telefono}</p>
                )}
                {oc.proveedor.direccion && (
                  <p className="text-gray-500 text-xs">{oc.proveedor.direccion}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Ítems */}
      <Card>
        <CardHeader><CardTitle>Ítems ({oc.items.length})</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Cant.</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Unidad</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Precio unit.</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Subtotal</th>
                {oc.estado !== "borrador" && (
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Recibido</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {oc.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-3 text-gray-400">{item.orden + 1}</td>
                  <td className="px-6 py-3 text-gray-800">{item.descripcion}</td>
                  <td className="px-6 py-3 text-right font-medium">{item.cantidad}</td>
                  <td className="px-6 py-3 text-gray-600">{item.unidadMedida}</td>
                  <td className="px-6 py-3 text-right text-gray-700">{formatCurrency(item.precioUnitario, oc.moneda)}</td>
                  <td className="px-6 py-3 text-right font-semibold text-gray-900">{formatCurrency(item.subtotal, oc.moneda)}</td>
                  {oc.estado !== "borrador" && (
                    <td className="px-6 py-3 text-right">
                      <span className={`text-xs font-medium ${item.cantRecibida >= item.cantidad ? "text-green-600" : item.cantRecibida > 0 ? "text-amber-600" : "text-gray-400"}`}>
                        {item.cantRecibida}/{item.cantidad}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td colSpan={oc.estado !== "borrador" ? 6 : 5} className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                  Total
                </td>
                <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                  {formatCurrency(oc.total, oc.moneda)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Facturas */}
      {oc.facturas.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Facturas ({oc.facturas.length})</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Emisión</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Vto.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {oc.facturas.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs">{f.numero}</td>
                    <td className="px-6 py-3 text-gray-600">Tipo {f.tipo}</td>
                    <td className="px-6 py-3 text-right font-semibold">{formatCurrency(f.total, f.moneda)}</td>
                    <td className="px-6 py-3"><StatusBadge estado={f.estado} /></td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(f.fechaEmision)}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{f.fechaVto ? formatDate(f.fechaVto) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Recepciones */}
      {oc.recepciones.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recepciones ({oc.recepciones.length})</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Fecha recepción</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Registrada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {oc.recepciones.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs">{r.numero}</td>
                    <td className="px-6 py-3"><StatusBadge estado={r.estado} /></td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(r.fechaRecepcion)}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(r.createdAt)}</td>
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
