"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/SelectField";
import { Textarea } from "@/components/ui/Textarea";
import { crearCotizacion } from "@/lib/actions/cotizaciones";
import { formatCurrency } from "@/lib/utils";

interface ItemOPI {
  id: string;
  cantidad: number;
  unidadMedida: string;
  presentacion: string;
  orden: number;
  categoria: { nombre: string };
  subCategoria: { nombre: string };
}

interface OPIParaForm {
  id: string;
  numero: string;
  descripcion: string;
  items: ItemOPI[];
}

interface Proveedor { id: string; nombre: string; cuit?: string | null; }

interface PrecioRow {
  itemOPIId: string;
  precioUnitario: string;
  observaciones: string;
}

interface CotizacionFormProps {
  opi: OPIParaForm;
  proveedores: Proveedor[];
}

function formatNum(n: number, decimals = 2) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function CotizacionForm({ opi, proveedores }: CotizacionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [proveedorId, setProveedorId] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [validezDias, setValidezDias] = useState("30");
  const [moneda, setMoneda] = useState("ARS");
  const [tipoCambioStr, setTipoCambioStr] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [precios, setPrecios] = useState<PrecioRow[]>(
    opi.items.map((i) => ({ itemOPIId: i.id, precioUnitario: "", observaciones: "" }))
  );

  function updatePrecio(itemOPIId: string, field: keyof PrecioRow, value: string) {
    setPrecios((prev) => prev.map((r) => (r.itemOPIId === itemOPIId ? { ...r, [field]: value } : r)));
  }

  const items = opi.items.map((item) => {
    const row = precios.find((r) => r.itemOPIId === item.id)!;
    const precio = parseFloat(row.precioUnitario) || 0;
    const subtotal = precio * item.cantidad;
    return { item, row, precio, subtotal };
  });

  const total = items.reduce((sum, r) => sum + r.subtotal, 0);
  const allFilled = precios.every((r) => parseFloat(r.precioUnitario) > 0);
  const tipoCambio = parseFloat(tipoCambioStr) || 0;

  // Conversión de moneda
  const totalARS = moneda === "ARS" ? total : (tipoCambio > 0 ? total * tipoCambio : 0);
  const totalUSD = moneda === "USD" ? total : (tipoCambio > 0 ? total / tipoCambio : 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!proveedorId) return setError("Seleccioná un proveedor");
    if (!allFilled) return setError("Completá el precio de todos los ítems");

    setLoading(true);
    const res = await crearCotizacion({
      opiId: opi.id,
      proveedorId,
      condiciones: condiciones || undefined,
      validezDias: validezDias ? parseInt(validezDias) : undefined,
      moneda,
      tipoCambio: tipoCambio > 0 ? tipoCambio : undefined,
      observaciones: observaciones || undefined,
      items: items.map(({ item, row, precio, subtotal }) => ({
        itemOPIId: item.id,
        precioUnitario: precio,
        cantidad: item.cantidad,
        subtotal,
        observaciones: row.observaciones || undefined,
      })),
    });

    if (res.error) { setError(res.error); setLoading(false); }
    else router.push(`/dashboard/opis/${opi.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* OPI referencia */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">OPI de referencia</p>
        <p className="text-sm font-mono text-blue-900 mt-0.5">{opi.numero}</p>
        <p className="text-sm text-blue-700">{opi.descripcion}</p>
      </div>

      {/* Proveedor y condiciones */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Proveedor y condiciones</h3>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Proveedor"
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            options={proveedores.map((p) => ({ value: p.id, label: `${p.nombre}${p.cuit ? ` (${p.cuit})` : ""}` }))}
            placeholder="Seleccioná proveedor..."
            required
          />
          <SelectField
            label="Moneda"
            value={moneda}
            onChange={(e) => setMoneda(e.target.value)}
            options={[{ value: "ARS", label: "ARS – Pesos" }, { value: "USD", label: "USD – Dólares" }]}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Validez (días)"
            type="number"
            min={1}
            value={validezDias}
            onChange={(e) => setValidezDias(e.target.value)}
          />
          <Input
            label="Condiciones de pago"
            value={condiciones}
            onChange={(e) => setCondiciones(e.target.value)}
            placeholder="Ej: 30 días, contado, etc."
          />
        </div>

        {/* Tipo de cambio */}
        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <Input
              label="Tipo de cambio (ARS / USD)"
              type="number"
              min={0.01}
              step="any"
              value={tipoCambioStr}
              onChange={(e) => setTipoCambioStr(e.target.value)}
              placeholder="Ej: 1250.00"
            />
            <p className="text-xs text-gray-400 mt-1">
              {moneda === "ARS"
                ? "Ingresá cuántos $ ARS vale 1 USD para ver el equivalente en dólares."
                : "Ingresá cuántos $ ARS vale 1 USD para ver el equivalente en pesos."}
            </p>
          </div>
          {tipoCambio > 0 && total > 0 && (
            <div className="pb-6">
              {moneda === "ARS" ? (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-0.5">Equivalente en USD</p>
                  <p className="text-xl font-bold text-green-800">
                    USD {formatNum(totalUSD)}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">@ ${formatNum(tipoCambio, 2)} ARS/USD</p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-0.5">Equivalente en ARS</p>
                  <p className="text-xl font-bold text-blue-800">
                    $ {formatNum(totalARS, 0)}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">@ ${formatNum(tipoCambio, 2)} ARS/USD</p>
                </div>
              )}
            </div>
          )}
        </div>

        <Textarea
          label="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          hint="Opcional"
          rows={2}
        />
      </div>

      {/* Precios por ítem */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Precios por ítem</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-500 w-6">#</th>
                <th className="py-2 pr-4 text-left text-xs font-semibold text-gray-500">Descripción</th>
                <th className="py-2 pr-4 text-right text-xs font-semibold text-gray-500 w-24">Cant.</th>
                <th className="py-2 pr-4 text-right text-xs font-semibold text-gray-500 w-36">
                  Precio unit. ({moneda}) *
                </th>
                <th className="py-2 text-right text-xs font-semibold text-gray-500 w-32">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map(({ item, row, subtotal }) => (
                <tr key={item.id}>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{item.orden + 1}</td>
                  <td className="py-3 pr-4">
                    <p className="text-gray-800 font-medium">{item.presentacion}</p>
                    <p className="text-xs text-gray-400">{item.categoria.nombre} · {item.subCategoria.nombre}</p>
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-600">
                    {item.cantidad} {item.unidadMedida}
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      min={0.01}
                      step="any"
                      value={row.precioUnitario}
                      onChange={(e) => updatePrecio(item.id, "precioUnitario", e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="0.00"
                      className="w-full text-right px-2 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      required
                    />
                  </td>
                  <td className="py-3 text-right font-medium text-gray-800">
                    {subtotal > 0 ? formatCurrency(subtotal, moneda) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={4} className="py-3 pr-4 text-right text-sm font-semibold text-gray-700">
                  Total {moneda}
                </td>
                <td className="py-3 text-right text-base font-bold text-gray-900">
                  {total > 0 ? formatCurrency(total, moneda) : "—"}
                </td>
              </tr>
              {tipoCambio > 0 && total > 0 && (
                <tr className="border-t border-gray-100">
                  <td colSpan={4} className="py-2 pr-4 text-right text-xs text-gray-400">
                    {moneda === "ARS" ? "≈ Total USD" : "≈ Total ARS"}
                  </td>
                  <td className="py-2 text-right text-sm font-semibold text-gray-500">
                    {moneda === "ARS"
                      ? `USD ${formatNum(totalUSD)}`
                      : `$ ${formatNum(totalARS, 0)}`}
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>Guardar cotización</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}
