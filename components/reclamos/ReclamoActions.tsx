"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { resolverReclamo, enviarReclamo } from "@/lib/actions/reclamos";

interface ReclamoActionsProps {
  reclamoId: string;
  estado: string;
  canAct: boolean;
}

export function ReclamoActions({ reclamoId, estado, canAct }: ReclamoActionsProps) {
  const router = useRouter();
  const [showResolver, setShowResolver] = useState(false);
  const [resolucion, setResolucion] = useState("reposicion");
  const [descripcion, setDescripcion] = useState("");
  const [notaCredito, setNotaCredito] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEnviar() {
    setLoading(true);
    const res = await enviarReclamo(reclamoId);
    if (res.error) { setError(res.error); }
    else { router.refresh(); }
    setLoading(false);
  }

  async function handleResolver() {
    setLoading(true);
    setError("");
    const res = await resolverReclamo(
      reclamoId,
      resolucion,
      descripcion || undefined,
      resolucion === "nota_de_credito" ? parseFloat(notaCredito) || undefined : undefined
    );
    if (res.error) { setError(res.error); setLoading(false); }
    else { setShowResolver(false); router.refresh(); }
    setLoading(false);
  }

  if (!canAct || estado === "resuelto" || estado === "cerrado_sin_resolucion") return null;

  return (
    <>
      <div className="flex gap-2">
        {estado === "abierto" && (
          <Button size="sm" variant="outline" loading={loading} onClick={handleEnviar}>
            Marcar como enviado
          </Button>
        )}
        {["abierto", "enviado", "en_negociacion"].includes(estado) && (
          <Button size="sm" onClick={() => { setError(""); setShowResolver(true); }}>
            Resolver reclamo
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      <Modal open={showResolver} onClose={() => setShowResolver(false)} title="Resolver reclamo">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de resolución *</label>
            <select
              value={resolucion}
              onChange={(e) => setResolucion(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="reposicion">Reposición de mercadería</option>
              <option value="nota_de_credito">Nota de crédito</option>
              <option value="baja_item">Baja del ítem</option>
            </select>
          </div>

          {resolucion === "nota_de_credito" && (
            <Input
              label="Monto nota de crédito"
              type="number"
              min="0"
              step="0.01"
              value={notaCredito}
              onChange={(e) => setNotaCredito(e.target.value)}
              placeholder="0.00"
            />
          )}

          <Textarea
            label="Descripción / Detalle"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            placeholder="Describí los términos acordados con el proveedor..."
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowResolver(false)}>Cancelar</Button>
            <Button size="sm" loading={loading} onClick={handleResolver}>Confirmar resolución</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
