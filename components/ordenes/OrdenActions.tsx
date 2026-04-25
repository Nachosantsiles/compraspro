"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { emitirOrden, cancelarOrden } from "@/lib/actions/ordenes";

interface OrdenActionsProps {
  ocId: string;
  ocNumero: string;
  canEmitir: boolean;
  canCancelar: boolean;
}

export function OrdenActions({ ocId, ocNumero, canEmitir, canCancelar }: OrdenActionsProps) {
  const router = useRouter();
  const [showEmitir, setShowEmitir] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEmitir() {
    setLoading(true);
    setError("");
    const res = await emitirOrden(ocId);
    if (res.error) { setError(res.error); setLoading(false); }
    else { setShowEmitir(false); router.refresh(); }
    setLoading(false);
  }

  async function handleCancelar() {
    if (!motivo.trim()) { setError("El motivo es obligatorio"); return; }
    setLoading(true);
    setError("");
    const res = await cancelarOrden(ocId, motivo);
    if (res.error) { setError(res.error); setLoading(false); }
    else { setShowCancelar(false); router.refresh(); }
    setLoading(false);
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {canEmitir && (
          <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-900">OC lista para emitir</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Al emitir se notifica al proveedor y la OC queda activa para recepciones.
              </p>
            </div>
            <Button size="sm" onClick={() => { setError(""); setShowEmitir(true); }}>
              Emitir OC
            </Button>
          </div>
        )}
        {canCancelar && (
          <Button
            size="sm"
            variant="danger"
            onClick={() => { setMotivo(""); setError(""); setShowCancelar(true); }}
          >
            Cancelar OC
          </Button>
        )}
      </div>

      {/* Modal emitir */}
      <Modal open={showEmitir} onClose={() => setShowEmitir(false)} title="Emitir Orden de Compra" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Vas a emitir la OC <span className="font-mono font-semibold">{ocNumero}</span>.
            Una vez emitida, quedará habilitada para registrar recepciones y facturas.
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowEmitir(false)}>Cancelar</Button>
            <Button size="sm" loading={loading} onClick={handleEmitir}>Confirmar emisión</Button>
          </div>
        </div>
      </Modal>

      {/* Modal cancelar */}
      <Modal open={showCancelar} onClose={() => setShowCancelar(false)} title="Cancelar OC" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Esta acción no se puede deshacer. Indicá el motivo.</p>
          <Textarea
            label="Motivo *"
            value={motivo}
            onChange={(e) => { setMotivo(e.target.value); setError(""); }}
            placeholder="Ej: Proveedor no disponible..."
            required
            rows={3}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCancelar(false)}>Volver</Button>
            <Button variant="danger" size="sm" loading={loading} onClick={handleCancelar}>Confirmar cancelación</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
