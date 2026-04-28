import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getOPIById } from "@/lib/queries/opis";
import { StatusBadge, UrgenciaBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ComparadorCotizaciones } from "@/components/cotizaciones/ComparadorCotizaciones";
import { CompraDirectaButton } from "@/components/cotizaciones/CompraDirectaButton";
import { AutFinPanel } from "@/components/autorizaciones/AutFinPanel";
import { EMPRESA_COLORS, formatDate, formatCurrency } from "@/lib/utils";
import type { RolEnum } from "@/types";

export default async function OPIDetallePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  const rol = user.rol as RolEnum;

  const opi = await getOPIById(params.id);
  if (!opi) notFound();

  const canCargarCotiz = ["admin", "comprador"].includes(rol) &&
    ["pendiente_cotizacion", "cotizacion_completa"].includes(opi.estado);

  const canSeleccionarGanadora = ["admin", "comprador"].includes(rol) &&
    ["pendiente_cotizacion", "cotizacion_completa"].includes(opi.estado);

  const canAutFin = ["admin", "finanzas"].includes(rol);

  const cotizGanadora = opi.cotizaciones.find((c) => c.seleccionada) ?? null;

  const ccLabel = opi.centroCosto
    ? `${opi.centroCosto.departamento.codigo} › ${opi.centroCosto.codigo} – ${opi.centroCosto.descripcion}`
    : opi.centroCostoFinca
    ? `${opi.centroCostoFinca.tipo} › ${opi.centroCostoFinca.categoria}${opi.centroCostoFinca.subcategoria ? ` › ${opi.centroCostoFinca.subcategoria}` : ""}`
    : "—";

  return (
    <div className="p-6 max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/opis" className="text-xs text-gray-500 hover:text-gray-700">
            ← OPIs
          </Link>
          <h2 className="text-xl font-bold text-gray-900 mt-1 font-mono">{opi.numero}</h2>
        </div>
        <div className="flex items-center gap-2">
          <UrgenciaBadge urgencia={opi.urgencia} />
          <StatusBadge estado={opi.estado} />
        </div>
      </div>

      {/* CTA: compra directa badge */}
      {opi.compraDirecta && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-blue-700 text-lg">🏷️</span>
          <div>
            <p className="text-sm font-semibold text-blue-900">Compra directa</p>
            <p className="text-xs text-blue-700 mt-0.5">Esta OPI fue marcada como compra directa — no requiere cotizaciones.</p>
          </div>
        </div>
      )}

      {/* CTA: cargar cotización */}
      {canCargarCotiz && !opi.compraDirecta && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {opi.cotizaciones.length === 0
                ? "Sin cotizaciones cargadas"
                : `${opi.cotizaciones.length} cotización(es) cargadas`}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {opi.cotizaciones.length === 0
                ? "Cargá al menos una cotización o marcá como compra directa."
                : "Podés agregar más cotizaciones o seleccionar una ganadora en el comparador."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CompraDirectaButton opiId={opi.id} />
            <Link href={`/dashboard/cotizaciones/nueva?opiId=${opi.id}`}>
              <Button size="sm">+ Cotización</Button>
            </Link>
          </div>
        </div>
      )}

      {/* OC Generada */}
      {opi.ordenCompra && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-teal-900">OC generada automáticamente</p>
            <p className="text-xs font-mono text-teal-700 mt-0.5">{opi.ordenCompra.numero} · {formatCurrency(opi.ordenCompra.total)}</p>
          </div>
          <Link href={`/dashboard/ordenes/${opi.ordenCompra.id}`}>
            <Button size="sm" variant="outline">Ver OC</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Datos principales */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Datos de la OPI</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Empresa</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EMPRESA_COLORS[opi.empresaId] ?? "#6b7280" }} />
                  <span className="font-medium text-gray-800">{opi.empresa.nombre}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Solicitante</p>
                <p className="font-medium text-gray-800">{opi.solicitante}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Imputación</p>
                <p className="text-gray-700 text-xs">{ccLabel}</p>
              </div>
              {opi.finca && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Finca</p>
                  <p className="text-gray-700">{opi.finca.nombre}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Fecha</p>
                <p className="text-gray-700">{formatDate(opi.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Creado por</p>
                <p className="text-gray-700">{opi.creador.nombre} {opi.creador.apellido}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Descripción</p>
              <p className="text-gray-800 text-sm">{opi.descripcion}</p>
            </div>
            {opi.observaciones && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Observaciones</p>
                <p className="text-gray-600 text-sm italic">{opi.observaciones}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen derecho */}
        <div className="space-y-4">
          {/* Cotización ganadora (cuando ya hay) */}
          {cotizGanadora && (
            <Card>
              <CardHeader><CardTitle>Cotización ganadora</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900">{cotizGanadora.proveedor.nombre}</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(cotizGanadora.total, cotizGanadora.moneda)}
                </p>
                {cotizGanadora.condiciones && (
                  <p className="text-xs text-gray-500">{cotizGanadora.condiciones}</p>
                )}
                <p className="text-xs text-gray-400">{cotizGanadora.numero}</p>
              </CardContent>
            </Card>
          )}

          {/* AutFin */}
          {opi.autFinanciera && (
            <AutFinPanel
              opiId={opi.id}
              opiNumero={opi.numero}
              estado={opi.autFinanciera.estado}
              aprobador={opi.autFinanciera.aprobador}
              fecha={opi.autFinanciera.fecha}
              comentario={opi.autFinanciera.comentario}
              canAct={canAutFin}
              cotizGanadora={cotizGanadora
                ? {
                    proveedor: cotizGanadora.proveedor,
                    total: cotizGanadora.total,
                    moneda: cotizGanadora.moneda,
                    condiciones: cotizGanadora.condiciones,
                  }
                : null}
            />
          )}
        </div>
      </div>

      {/* Ítems */}
      <Card>
        <CardHeader><CardTitle>Ítems ({opi.items.length})</CardTitle></CardHeader>
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
                {cotizGanadora && (
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Precio unit.</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {opi.items.map((item) => {
                const itemCot = cotizGanadora?.items.find((ci) => ci.itemOPIId === item.id);
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-3 text-gray-400">{item.orden + 1}</td>
                    <td className="px-6 py-3 font-medium">{item.cantidad}</td>
                    <td className="px-6 py-3">{item.presentacion}</td>
                    <td className="px-6 py-3 text-gray-600">{item.unidadMedida}</td>
                    <td className="px-6 py-3 text-gray-700">{item.categoria.nombre}</td>
                    <td className="px-6 py-3 text-gray-600">{item.subCategoria.nombre}</td>
                    {cotizGanadora && (
                      <td className="px-6 py-3 text-right text-gray-700">
                        {itemCot ? formatCurrency(itemCot.precioUnitario, cotizGanadora.moneda) : "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Comparador de cotizaciones */}
      {opi.cotizaciones.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Comparador de cotizaciones</CardTitle>
              {canCargarCotiz && !opi.compraDirecta && (
                <Link href={`/dashboard/cotizaciones/nueva?opiId=${opi.id}`}>
                  <Button size="sm" variant="outline">+ Agregar cotización</Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ComparadorCotizaciones
              opiId={opi.id}
              opiEstado={opi.estado}
              opiNumero={opi.numero}
              opisItems={opi.items}
              cotizaciones={opi.cotizaciones.map((c) => ({
                id: c.id,
                numero: c.numero,
                seleccionada: c.seleccionada,
                estado: c.estado,
                moneda: c.moneda,
                total: c.total,
                condiciones: c.condiciones,
                validezDias: c.validezDias,
                proveedor: c.proveedor,
                items: c.items.map((ci) => ({
                  itemOPIId: ci.itemOPIId,
                  precioUnitario: ci.precioUnitario,
                  subtotal: ci.subtotal,
                })),
              }))}
              canSelect={canSeleccionarGanadora}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
