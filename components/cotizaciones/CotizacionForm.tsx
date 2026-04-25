"use client";

import { useState, useEffect } from "react";
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
  precioUnitario: string; // string para el input
  observaciones: string;
}

interface CotizacionFormProps {
  opi: OPIParaForm;
  proveedores: Proveedor[];
}

export function CotizacionForm({ opi, proveedores }: CotizacionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [proveedorId, setProveedorId] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [validezDias, setValidezDias] = useState("30");
  const [moneda, setMoneda] = useState("ARS");
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
                <th className="py-2 pr-4 text-right text-xs font-semibold text-gray-500 w-36">Precio unit. *</th>
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
                  Total
                </td>
                <td className="py-3 text-right text-base font-bold text-gray-900">
                  {total > 0 ? formatCurrency(total, moneda) : "—"}
                </td>
              </tr>
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
