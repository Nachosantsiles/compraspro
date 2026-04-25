"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { registrarPago } from "@/lib/actions/pagos";
import { formatCurrency, formatDate } from "@/lib/utils";

interface FacturaPendiente {
  id: string;
  numero: string;
  tipo: string;
  total: number;
  moneda: string;
  estado: string;
  fechaVto: Date | null;
  proveedor: { nombre: string };
  oc: { numero: string; opi: { empresa: { nombre: string } } };
  pagos: { monto: number }[];
}

interface PagoFormProps {
  facturasPendientes: FacturaPendiente[];
}

export function PagoForm({ facturasPendientes }: PagoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [medio, setMedio] = useState("transferencia");
  const [moneda, setMoneda] = useState("ARS");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [referencia, setReferencia] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // montos por facturaId
  const [montos, setMontos] = useState<Record<string, string>>({});
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());

  function toggleFactura(id: string) {
    const next = new Set(seleccionadas);
    if (next.has(id)) {
      next.delete(id);
      const m = { ...montos };
      delete m[id];
      setMontos(m);
    } else {
      next.add(id);
      const f = facturasPendientes.find((x) => x.id === id)!;
      const pagado = f.pagos.reduce((a, p) => a + p.monto, 0);
      setMontos((prev) => ({ ...prev, [id]: String((f.total - pagado).toFixed(2)) }));
    }
    setSeleccionadas(next);
  }

  const total = Array.from(seleccionadas).reduce((acc, id) => acc + (parseFloat(montos[id]) || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!seleccionadas.size) { setError("Seleccioná al menos una factura"); return; }
    if (total <= 0) { setError("El monto total debe ser mayor a 0"); return; }

    setLoading(true);
    setError("");

    const res = await registrarPago({
      medio,
      moneda,
      fecha,
      referencia: referencia || undefined,
      observaciones: observaciones || undefined,
      facturas: Array.from(seleccionadas).map((id) => ({
        facturaId: id,
        monto: parseFloat(montos[id]) || 0,
      })),
    });

    if (res.error) { setError(res.error); setLoading(false); return; }
    setExito(`Pago ${res.numero} registrado correctamente.`);
    setTimeout(() => router.push("/dashboard/pagos"), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Facturas */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">
          Facturas pendientes ({facturasPendientes.length})
        </p>
        {facturasPendientes.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center text-sm text-gray-400">
            No hay facturas pendientes de pago.
          </div>
        ) : (
          <div className="space-y-2">
            {facturasPendientes.map((f) => {
              const pagado = f.pagos.reduce((a, p) => a + p.monto, 0);
              const saldo = f.total - pagado;
              const vencida = f.fechaVto && new Date(f.fechaVto) < new Date();
              const checked = seleccionadas.has(f.id);

              return (
                <div
                  key={f.id}
                  className={`border rounded-xl p-4 cursor-pointer transition-colors ${
                    checked ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => toggleFactura(f.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFactura(f.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-gray-900">{f.numero}</span>
                        <span className="text-xs text-gray-400">Tipo {f.tipo}</span>
                        {vencida && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">Vencida</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {f.proveedor.nombre} · OC {f.oc.numero} · {f.oc.opi.empresa.nombre}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                        <span>Total: <strong>{formatCurrency(f.total, f.moneda)}</strong></span>
                        {pagado > 0 && <span>Pagado: {formatCurrency(pagado, f.moneda)}</span>}
                        <span className="font-semibold text-blue-700">Saldo: {formatCurrency(saldo, f.moneda)}</span>
                        {f.fechaVto && <span>Vto: {formatDate(f.fechaVto as unknown as Date)}</span>}
                      </div>
                    </div>
                    {checked && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Input
                          label="Monto a pagar"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={montos[f.id] ?? ""}
                          onChange={(e) => setMontos((prev) => ({ ...prev, [f.id]: e.target.value }))}
                          className="w-36"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Datos del pago */}
      <div className="border border-gray-200 rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Datos del pago</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Medio de pago *</label>
            <select
              value={medio}
              onChange={(e) => setMedio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="transferencia">Transferencia bancaria</option>
              <option value="cheque">Cheque</option>
              <option value="efectivo">Efectivo</option>
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
            label="Fecha del pago *"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
          <Input
            label="Referencia / N° transferencia"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ej: TRF-20240501-001"
          />
        </div>
        <Textarea
          label="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
          placeholder="Notas opcionales..."
        />
      </div>

      {/* Total */}
      {seleccionadas.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex items-center justify-between">
          <p className="text-sm text-blue-800">
            {seleccionadas.size} factura{seleccionadas.size !== 1 ? "s" : ""} seleccionada{seleccionadas.size !== 1 ? "s" : ""}
          </p>
          <p className="text-lg font-bold text-blue-900">{formatCurrency(total, moneda)}</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {exito && <p className="text-sm text-green-600 font-medium">{exito}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" loading={loading} disabled={seleccionadas.size === 0}>
          Registrar pago {seleccionadas.size > 0 ? `· ${formatCurrency(total, moneda)}` : ""}
        </Button>
      </div>
    </form>
  );
}
