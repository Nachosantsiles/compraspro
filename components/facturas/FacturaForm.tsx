"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { crearFactura } from "@/lib/actions/facturas";
import { formatCurrency } from "@/lib/utils";

interface OC {
  id: string;
  numero: string;
  total: number;
  moneda: string;
  condiciones: string | null;
  proveedor: { nombre: string };
  opi: { numero: string; empresa: { nombre: string } };
}

interface FacturaFormProps {
  oc: OC;
}

export function FacturaForm({ oc }: FacturaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [numero, setNumero] = useState("");
  const [tipo, setTipo] = useState("A");
  const [moneda, setMoneda] = useState(oc.moneda);
  const [subtotal, setSubtotal] = useState("");
  const [iva, setIva] = useState("");
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split("T")[0]);
  const [fechaVto, setFechaVto] = useState("");

  const subtotalNum = parseFloat(subtotal) || 0;
  const ivaNum = parseFloat(iva) || 0;
  const total = subtotalNum + ivaNum;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!numero.trim()) { setError("El número de factura es obligatorio"); return; }
    if (subtotalNum <= 0) { setError("El subtotal debe ser mayor a 0"); return; }

    setLoading(true);
    setError("");

    const res = await crearFactura({
      ocId: oc.id,
      numero: numero.trim(),
      tipo,
      moneda,
      subtotal: subtotalNum,
      iva: ivaNum,
      fechaEmision,
      fechaVto: fechaVto || undefined,
    });

    if (res.error) { setError(res.error); setLoading(false); return; }
    router.push(`/dashboard/ordenes/${oc.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos de la OC */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Orden de Compra</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">Número OC</p>
            <p className="font-mono font-semibold text-gray-900">{oc.numero}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">OPI</p>
            <p className="font-mono text-gray-700">{oc.opi.numero}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Proveedor</p>
            <p className="font-semibold text-gray-800">{oc.proveedor.nombre}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Empresa</p>
            <p className="text-gray-700">{oc.opi.empresa.nombre}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Monto OC</p>
            <p className="font-semibold text-gray-900">{formatCurrency(oc.total, oc.moneda)}</p>
          </div>
          {oc.condiciones && (
            <div>
              <p className="text-xs text-gray-400">Condiciones</p>
              <p className="text-gray-700">{oc.condiciones}</p>
            </div>
          )}
        </div>
      </div>

      {/* Datos de la factura */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Número de factura *"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="Ej: 0001-00001234"
          required
        />
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="A">Tipo A</option>
            <option value="B">Tipo B</option>
            <option value="C">Tipo C</option>
            <option value="E">Tipo E (Exportación)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Moneda *</label>
          <select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ARS">ARS – Pesos</option>
            <option value="USD">USD – Dólares</option>
          </select>
        </div>

        <Input
          label="Fecha de emisión *"
          type="date"
          value={fechaEmision}
          onChange={(e) => setFechaEmision(e.target.value)}
          required
        />

        <Input
          label="Fecha de vencimiento"
          type="date"
          value={fechaVto}
          onChange={(e) => setFechaVto(e.target.value)}
        />
      </div>

      {/* Importes */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Importes</p>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Subtotal (neto) *"
            type="number"
            min="0"
            step="0.01"
            value={subtotal}
            onChange={(e) => setSubtotal(e.target.value)}
            placeholder="0.00"
            required
          />
          <Input
            label="IVA"
            type="number"
            min="0"
            step="0.01"
            value={iva}
            onChange={(e) => setIva(e.target.value)}
            placeholder="0.00"
          />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
            <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm font-bold text-gray-900">
              {formatCurrency(total, moneda)}
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" loading={loading}>Registrar factura</Button>
      </div>
    </form>
  );
}
