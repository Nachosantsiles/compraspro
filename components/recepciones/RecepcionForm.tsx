"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { crearRecepcion } from "@/lib/actions/recepciones";
import { formatCurrency } from "@/lib/utils";

interface ItemOC {
  id: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  cantRecibida: number;
  precioUnitario: number;
  subtotal: number;
}

interface OC {
  id: string;
  numero: string;
  moneda: string;
  proveedor: { nombre: string };
  opi: { numero: string; empresa: { nombre: string } };
  items: ItemOC[];
}

export function RecepcionForm({ oc }: { oc: OC }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [observaciones, setObservaciones] = useState("");
  const [cantidades, setCantidades] = useState<Record<string, string>>(
    Object.fromEntries(oc.items.map((i) => [i.id, String(Math.max(0, i.cantidad - i.cantRecibida))]))
  );

  function setCantidad(id: string, val: string) {
    setCantidades((prev) => ({ ...prev, [id]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const items = oc.items.map((i) => ({
      itemOCId: i.id,
      cantRecibida: parseFloat(cantidades[i.id]) || 0,
    }));

    const res = await crearRecepcion({
      ocId: oc.id,
      fechaRecepcion: fecha,
      observaciones: observaciones || undefined,
      items,
    });

    if (res.error) { setError(res.error); setLoading(false); return; }
    router.push(`/dashboard/recepciones/${res.recepcionId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* OC info */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-400">OC</p>
          <p className="font-mono font-semibold">{oc.numero}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Proveedor</p>
          <p className="font-semibold">{oc.proveedor.nombre}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">OPI / Empresa</p>
          <p>{oc.opi.numero} · {oc.opi.empresa.nombre}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha de recepción *"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
      </div>

      {/* Items */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Cantidades recibidas por ítem</p>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Descripción</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Pedido</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Ya recibido</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Precio unit.</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Cant. a recibir</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {oc.items.map((item) => {
                const val = parseFloat(cantidades[item.id]) || 0;
                const pendiente = item.cantidad - item.cantRecibida;
                const diff = val - pendiente;
                let diffLabel = "";
                let diffColor = "";
                if (val > 0) {
                  if (diff === 0) { diffLabel = "✓ OK"; diffColor = "text-green-600"; }
                  else if (diff < 0) { diffLabel = `Faltante (${diff})`; diffColor = "text-red-600"; }
                  else { diffLabel = `Exceso (+${diff})`; diffColor = "text-amber-600"; }
                }

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="text-gray-800">{item.descripcion}</p>
                      <p className="text-xs text-gray-400">{item.unidadMedida}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{item.cantidad}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{item.cantRecibida}</td>
                    <td className="px-4 py-3 text-right text-gray-600 text-xs">
                      {formatCurrency(item.precioUnitario, oc.moneda)}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={cantidades[item.id]}
                        onChange={(e) => setCantidad(item.id, e.target.value)}
                        className="w-24 mx-auto block border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className={`px-4 py-3 text-center text-xs font-medium ${diffColor}`}>
                      {diffLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Textarea
        label="Observaciones"
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        rows={2}
        placeholder="Notas opcionales sobre la recepción..."
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" loading={loading}>Registrar recepción</Button>
      </div>
    </form>
  );
}
