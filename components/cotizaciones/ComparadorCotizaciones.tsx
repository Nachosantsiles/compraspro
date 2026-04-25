"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { seleccionarGanadora } from "@/lib/actions/cotizaciones";
import { formatCurrency } from "@/lib/utils";

interface ItemOPI {
  id: string;
  orden: number;
  cantidad: number;
  unidadMedida: string;
  presentacion: string;
  categoria: { nombre: string };
  subCategoria: { nombre: string };
}

interface ItemCot {
  itemOPIId: string;
  precioUnitario: number;
  subtotal: number;
}

interface Cotizacion {
  id: string;
  numero: string;
  seleccionada: boolean;
  estado: string;
  moneda: string;
  total: number;
  condiciones: string | null;
  validezDias: number | null;
  proveedor: { id: string; nombre: string };
  items: ItemCot[];
}

interface ComparadorProps {
  opiId: string;
  opiEstado: string;
  opisItems: ItemOPI[];
  cotizaciones: Cotizacion[];
  canSelect: boolean;
  opiNumero: string;
}

export function ComparadorCotizaciones({
  opiId,
  opiEstado,
  opisItems,
  cotizaciones,
  canSelect,
  opiNumero,
}: ComparadorProps) {
  const router = useRouter();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (cotizaciones.length === 0) return null;

  const ganadora = cotizaciones.find((c) => c.seleccionada);
  const enCotizacion = ["pendiente_cotizacion", "cotizacion_completa"].includes(opiEstado);
  const puedeSeleccionar = canSelect && enCotizacion && cotizaciones.length >= 2;

  // Moneda predominante
  const moneda = cotizaciones[0]?.moneda ?? "ARS";

  // Precio mínimo por ítem (para resaltar)
  const minPorItem: Record<string, number> = {};
  opisItems.forEach((item) => {
    const precios = cotizaciones.map((c) => {
      const ci = c.items.find((i) => i.itemOPIId === item.id);
      return ci ? ci.precioUnitario : Infinity;
    });
    minPorItem[item.id] = Math.min(...precios);
  });
  const minTotal = Math.min(...cotizaciones.map((c) => c.total));

  async function confirmarGanadora() {
    if (!confirmId) return;
    setLoading(true);
    setError("");
    const res = await seleccionarGanadora(confirmId, opiId);
    if (res.error) { setError(res.error); }
    else { setConfirmId(null); router.refresh(); }
    setLoading(false);
  }

  const confirmCot = cotizaciones.find((c) => c.id === confirmId);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">
            Comparador de cotizaciones ({cotizaciones.length})
          </h4>
          {cotizaciones.length < 2 && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
              Faltan {2 - cotizaciones.length} cotización(es) para poder seleccionar
            </span>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 sticky left-0 bg-gray-50 min-w-[200px]">
                  Ítem
                </th>
                {cotizaciones.map((c) => (
                  <th key={c.id} className={`px-4 py-3 text-right text-xs font-semibold min-w-[160px] ${c.seleccionada ? "bg-green-50 text-green-800" : "text-gray-700"}`}>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="truncate max-w-[140px]">{c.proveedor.nombre}</span>
                      <span className="text-[10px] font-normal text-gray-400">{c.numero}</span>
                      {c.seleccionada && <span className="text-[10px] text-green-600 font-semibold">✓ GANADORA</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {opisItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 sticky left-0 bg-white">
                    <p className="text-gray-800 font-medium truncate max-w-[190px]">{item.presentacion}</p>
                    <p className="text-xs text-gray-400">{item.categoria.nombre} · {item.subCategoria.nombre}</p>
                    <p className="text-xs text-gray-400">{item.cantidad} {item.unidadMedida}</p>
                  </td>
                  {cotizaciones.map((c) => {
                    const ci = c.items.find((i) => i.itemOPIId === item.id);
                    const esMin = ci && ci.precioUnitario === minPorItem[item.id] && cotizaciones.length > 1;
                    return (
                      <td key={c.id} className={`px-4 py-3 text-right ${c.seleccionada ? "bg-green-50" : ""}`}>
                        {ci ? (
                          <div>
                            <p className={`font-medium ${esMin ? "text-green-700" : "text-gray-800"}`}>
                              {esMin && <span className="mr-1">↓</span>}
                              {formatCurrency(ci.precioUnitario, c.moneda)}
                            </p>
                            <p className="text-xs text-gray-400">{formatCurrency(ci.subtotal, c.moneda)} total</p>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Condiciones */}
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="px-4 py-2 text-xs text-gray-500 font-medium sticky left-0 bg-gray-50">Condiciones</td>
                {cotizaciones.map((c) => (
                  <td key={c.id} className={`px-4 py-2 text-right text-xs text-gray-500 ${c.seleccionada ? "bg-green-50" : ""}`}>
                    {c.condiciones ?? "—"}
                    {c.validezDias && <span className="ml-1 text-gray-400">({c.validezDias}d)</span>}
                  </td>
                ))}
              </tr>

              {/* Totales */}
              <tr className="border-t-2 border-gray-200 font-semibold">
                <td className="px-4 py-3 text-sm text-gray-700 sticky left-0 bg-white">TOTAL</td>
                {cotizaciones.map((c) => {
                  const esMinTotal = c.total === minTotal && cotizaciones.length > 1;
                  return (
                    <td key={c.id} className={`px-4 py-3 text-right ${c.seleccionada ? "bg-green-50" : ""}`}>
                      <p className={`text-base font-bold ${esMinTotal ? "text-green-700" : "text-gray-900"}`}>
                        {esMinTotal && <span className="mr-1 text-sm">↓</span>}
                        {formatCurrency(c.total, c.moneda)}
                      </p>
                    </td>
                  );
                })}
              </tr>

              {/* Botones selección */}
              {puedeSeleccionar && (
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-3 sticky left-0 bg-white" />
                  {cotizaciones.map((c) => (
                    <td key={c.id} className={`px-4 py-3 text-right ${c.seleccionada ? "bg-green-50" : ""}`}>
                      {c.seleccionada ? (
                        <span className="text-xs text-green-600 font-semibold">✓ Seleccionada</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setError(""); setConfirmId(c.id); }}
                        >
                          Seleccionar ganadora
                        </Button>
                      )}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!enCotizacion && ganadora && (
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Cotización ganadora: <strong>{ganadora.proveedor.nombre}</strong> — {formatCurrency(ganadora.total, ganadora.moneda)}
          </div>
        )}
      </div>

      {/* Modal confirmar selección */}
      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Confirmar cotización ganadora"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Vas a seleccionar como ganadora la cotización de{" "}
            <strong>{confirmCot?.proveedor.nombre}</strong> por{" "}
            <strong>{confirmCot ? formatCurrency(confirmCot.total, confirmCot.moneda) : ""}</strong>.
          </p>
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            Al confirmar, la OPI avanzará a <strong>Pendiente de Autorización Financiera</strong>.
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>Cancelar</Button>
            <Button size="sm" loading={loading} onClick={confirmarGanadora}>
              Confirmar selección
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
