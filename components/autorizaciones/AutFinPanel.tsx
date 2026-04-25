"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { aprobarAutFin, rechazarAutFin } from "@/lib/actions/autorizaciones";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AutFinPanelProps {
  opiId: string;
  opiNumero: string;
  estado: string;
  aprobador?: { nombre: string; apellido: string } | null;
  fecha?: Date | string | null;
  comentario?: string | null;
  canAct: boolean;
  cotizGanadora?: {
    proveedor: { nombre: string };
    total: number;
    moneda: string;
    condiciones?: string | null;
  } | null;
}

export function AutFinPanel({
  opiId,
  opiNumero,
  estado,
  aprobador,
  fecha,
  comentario,
  canAct,
  cotizGanadora,
}: AutFinPanelProps) {
  const router = useRouter();
  const [showAprobar, setShowAprobar] = useState(false);
  const [showRechazar, setShowRechazar] = useState(false);
  const [comentarioModal, setComentarioModal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ocNumero, setOcNumero] = useState("");

  async function handleAprobar() {
    setLoading(true);
    setError("");
    const res = await aprobarAutFin(opiId, comentarioModal);
    if (res.error) { setError(res.error); setLoading(false); }
    else {
      setOcNumero(res.ocNumero ?? "");
      setShowAprobar(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleRechazar() {
    if (!comentarioModal.trim()) { setError("El motivo es obligatorio"); return; }
    setLoading(true);
    setError("");
    const res = await rechazarAutFin(opiId, comentarioModal);
    if (res.error) { setError(res.error); setLoading(false); }
    else { setShowRechazar(false); router.refresh(); }
    setLoading(false);
  }

  const colores = {
    pendiente: "border-purple-200 bg-purple-50",
    aprobada: "border-green-200 bg-green-50",
    rechazada: "border-red-200 bg-red-50",
  };
  const iconos = { pendiente: "🔵", aprobada: "✅", rechazada: "❌" };

  return (
    <>
      <div className={`rounded-xl border p-5 ${colores[estado as keyof typeof colores] ?? "border-gray-200 bg-gray-50"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span>{iconos[estado as keyof typeof iconos]}</span>
              <h4 className="text-sm font-semibold text-gray-900">Autorización Financiera</h4>
            </div>

            {estado === "pendiente" && cotizGanadora && (
              <div className="text-sm text-purple-800 bg-purple-100 rounded-lg px-3 py-2 space-y-1">
                <p className="font-medium">Cotización ganadora seleccionada</p>
                <p className="text-xs">
                  Proveedor: <strong>{cotizGanadora.proveedor.nombre}</strong>
                </p>
                <p className="text-xs">
                  Monto: <strong>{formatCurrency(cotizGanadora.total, cotizGanadora.moneda)}</strong>
                  {cotizGanadora.condiciones && <span className="ml-2 text-purple-600">· {cotizGanadora.condiciones}</span>}
                </p>
                <p className="text-xs text-purple-600">
                  Al aprobar se generará automáticamente la Orden de Compra.
                </p>
              </div>
            )}

            {estado === "aprobada" && (
              <p className="text-sm text-green-700">
                Aprobada por {aprobador?.nombre} {aprobador?.apellido}
                {fecha && ` · ${formatDate(fecha as Date)}`}
              </p>
            )}
            {estado === "rechazada" && (
              <p className="text-sm text-red-700">
                Rechazada por {aprobador?.nombre} {aprobador?.apellido}
                {fecha && ` · ${formatDate(fecha as Date)}`}
              </p>
            )}
            {comentario && (
              <p className="text-sm text-gray-600 italic">"{comentario}"</p>
            )}
          </div>

          {canAct && estado === "pendiente" && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setComentarioModal(""); setError(""); setShowRechazar(true); }}
              >
                Rechazar
              </Button>
              <Button
                size="sm"
                onClick={() => { setComentarioModal(""); setError(""); setShowAprobar(true); }}
              >
                Aprobar y generar OC
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal aprobar */}
      <Modal open={showAprobar} onClose={() => setShowAprobar(false)} title="Aprobar y generar OC">
        <div className="space-y-4">
          {cotizGanadora && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
              <p className="font-semibold text-gray-800">Resumen de la aprobación</p>
              <p className="text-gray-600">OPI: <span className="font-mono">{opiNumero}</span></p>
              <p className="text-gray-600">Proveedor: <strong>{cotizGanadora.proveedor.nombre}</strong></p>
              <p className="text-gray-600">Monto OC: <strong>{formatCurrency(cotizGanadora.total, cotizGanadora.moneda)}</strong></p>
            </div>
          )}
          <Textarea
            label="Comentario (opcional)"
            value={comentarioModal}
            onChange={(e) => setComentarioModal(e.target.value)}
            placeholder="Observaciones de la aprobación..."
            rows={2}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAprobar(false)}>Cancelar</Button>
            <Button size="sm" loading={loading} onClick={handleAprobar}>
              Confirmar y generar OC
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal rechazar */}
      <Modal open={showRechazar} onClose={() => setShowRechazar(false)} title="Rechazar OPI" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Indicá el motivo del rechazo financiero.</p>
          <Textarea
            label="Motivo *"
            value={comentarioModal}
            onChange={(e) => { setComentarioModal(e.target.value); setError(""); }}
            placeholder="Ej: Excede el presupuesto del período..."
            required
            rows={3}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowRechazar(false)}>Cancelar</Button>
            <Button variant="danger" size="sm" loading={loading} onClick={handleRechazar}>Confirmar rechazo</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
