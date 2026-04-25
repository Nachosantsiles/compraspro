"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { aprobarAutTecnica, rechazarAutTecnica } from "@/lib/actions/pedidos";
import { formatDate } from "@/lib/utils";

interface AutecPanelProps {
  pedidoId: string;
  estado: string; // pendiente | aprobada | rechazada
  aprobador?: { nombre: string; apellido: string } | null;
  fecha?: Date | string | null;
  comentario?: string | null;
  canAct: boolean;
}

export function AutecPanel({ pedidoId, estado, aprobador, fecha, comentario, canAct }: AutecPanelProps) {
  const router = useRouter();
  const [showAprobar, setShowAprobar] = useState(false);
  const [showRechazar, setShowRechazar] = useState(false);
  const [comentarioModal, setComentarioModal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAprobar() {
    setLoading(true);
    const res = await aprobarAutTecnica(pedidoId, comentarioModal);
    if (res.error) setError(res.error);
    else { setShowAprobar(false); router.refresh(); }
    setLoading(false);
  }

  async function handleRechazar() {
    if (!comentarioModal.trim()) { setError("Ingresá el motivo del rechazo"); return; }
    setLoading(true);
    const res = await rechazarAutTecnica(pedidoId, comentarioModal);
    if (res.error) setError(res.error);
    else { setShowRechazar(false); router.refresh(); }
    setLoading(false);
  }

  const colores = {
    pendiente: "border-yellow-200 bg-yellow-50",
    aprobada: "border-green-200 bg-green-50",
    rechazada: "border-red-200 bg-red-50",
  };
  const iconos = {
    pendiente: "⏳",
    aprobada: "✅",
    rechazada: "❌",
  };

  return (
    <>
      <div className={`rounded-xl border p-5 ${colores[estado as keyof typeof colores] ?? "border-gray-200 bg-gray-50"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span>{iconos[estado as keyof typeof iconos]}</span>
              <h4 className="text-sm font-semibold text-gray-900">Autorización Técnica</h4>
            </div>

            {estado === "pendiente" && (
              <p className="text-sm text-yellow-700 mt-1">Pendiente de revisión técnica</p>
            )}
            {estado === "aprobada" && aprobador && (
              <p className="text-sm text-green-700 mt-1">
                Aprobada por {aprobador.nombre} {aprobador.apellido}
                {fecha ? ` · ${formatDate(fecha as Date)}` : ""}
              </p>
            )}
            {estado === "rechazada" && aprobador && (
              <p className="text-sm text-red-700 mt-1">
                Rechazada por {aprobador.nombre} {aprobador.apellido}
                {fecha ? ` · ${formatDate(fecha as Date)}` : ""}
              </p>
            )}
            {comentario && (
              <p className="mt-2 text-sm text-gray-600 italic">"{comentario}"</p>
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
                Aprobar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal aprobar */}
      <Modal open={showAprobar} onClose={() => setShowAprobar(false)} title="Aprobar pedido" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">¿Confirmás la aprobación técnica de este pedido?</p>
          <Textarea
            label="Comentario (opcional)"
            value={comentarioModal}
            onChange={(e) => setComentarioModal(e.target.value)}
            placeholder="Observaciones técnicas..."
            rows={2}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAprobar(false)}>Cancelar</Button>
            <Button size="sm" loading={loading} onClick={handleAprobar}>Confirmar aprobación</Button>
          </div>
        </div>
      </Modal>

      {/* Modal rechazar */}
      <Modal open={showRechazar} onClose={() => setShowRechazar(false)} title="Rechazar pedido" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Indicá el motivo del rechazo técnico.</p>
          <Textarea
            label="Motivo"
            value={comentarioModal}
            onChange={(e) => { setComentarioModal(e.target.value); setError(""); }}
            placeholder="Ej: Material no disponible en el catálogo aprobado..."
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
