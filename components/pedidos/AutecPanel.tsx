"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { cn, formatDate } from "@/lib/utils";
import { aprobarAutTecnica, rechazarAutTecnica, aprobarParcialAutTecnica } from "@/lib/actions/pedidos";

interface ItemPedido {
  id: string;
  orden: number;
  cantidad: number;
  unidadMedida: string;
  presentacion: string;
  categoria: { nombre: string };
  subCategoria: { nombre: string };
}

interface ItemAutTec {
  itemPedidoId: string;
  estado: string; // ok | denegado | modificado
  nuevaCantidad: number | null;
}

interface AutecPanelProps {
  pedidoId: string;
  estado: string; // pendiente | aprobada | aprobada_parcial | rechazada
  aprobador?: { nombre: string; apellido: string } | null;
  fecha?: Date | string | null;
  comentario?: string | null;
  canAct: boolean;
  items: ItemPedido[];
  itemsAutTec: ItemAutTec[];
}

type ItemDecisionEstado = "ok" | "denegado" | "modificado";

interface DecisionRow {
  estado: ItemDecisionEstado;
  nuevaCantidad: string;
}

export function AutecPanel({
  pedidoId,
  estado,
  aprobador,
  fecha,
  comentario,
  canAct,
  items,
  itemsAutTec,
}: AutecPanelProps) {
  const router = useRouter();

  // Modales simples
  const [showAprobar,  setShowAprobar]  = useState(false);
  const [showRechazar, setShowRechazar] = useState(false);
  const [showParcial,  setShowParcial]  = useState(false);

  const [comentarioModal, setComentarioModal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Decisiones por ítem para aprobación parcial (inicializa en "ok")
  const [decisiones, setDecisiones] = useState<Record<string, DecisionRow>>(() =>
    Object.fromEntries(
      items.map((i) => [i.id, { estado: "ok" as ItemDecisionEstado, nuevaCantidad: String(i.cantidad) }])
    )
  );

  function setDecision(itemId: string, nuevoEstado: ItemDecisionEstado) {
    setDecisiones((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        estado: nuevoEstado,
        // Al pasar a "modificado", preinicializar con la cantidad original si estaba en otro estado
        nuevaCantidad:
          nuevoEstado === "modificado" ? prev[itemId].nuevaCantidad : prev[itemId].nuevaCantidad,
      },
    }));
  }

  function setCantidad(itemId: string, value: string) {
    setDecisiones((prev) => ({ ...prev, [itemId]: { ...prev[itemId], nuevaCantidad: value } }));
  }

  function openModal(tipo: "aprobar" | "rechazar" | "parcial") {
    setComentarioModal("");
    setError("");
    if (tipo === "aprobar")  setShowAprobar(true);
    if (tipo === "rechazar") setShowRechazar(true);
    if (tipo === "parcial") {
      // Resetear decisiones a "ok" cada vez que se abre
      setDecisiones(
        Object.fromEntries(
          items.map((i) => [i.id, { estado: "ok" as ItemDecisionEstado, nuevaCantidad: String(i.cantidad) }])
        )
      );
      setShowParcial(true);
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────

  async function handleAprobar() {
    setLoading(true);
    const res = await aprobarAutTecnica(pedidoId, comentarioModal);
    if (res.error) { setError(res.error); setLoading(false); }
    else { setShowAprobar(false); router.refresh(); }
    setLoading(false);
  }

  async function handleRechazar() {
    if (!comentarioModal.trim()) { setError("Ingresá el motivo del rechazo"); return; }
    setLoading(true);
    const res = await rechazarAutTecnica(pedidoId, comentarioModal);
    if (res.error) { setError(res.error); setLoading(false); }
    else { setShowRechazar(false); router.refresh(); }
    setLoading(false);
  }

  async function handleParcial() {
    setError("");
    const decisionArray = items.map((item) => {
      const d = decisiones[item.id] ?? { estado: "ok", nuevaCantidad: String(item.cantidad) };
      return {
        itemPedidoId: item.id,
        estado: d.estado,
        nuevaCantidad: d.estado === "modificado" ? parseFloat(d.nuevaCantidad) || 0 : undefined,
      };
    });

    setLoading(true);
    const res = await aprobarParcialAutTecnica(pedidoId, decisionArray, comentarioModal || undefined);
    if (res.error) { setError(res.error); setLoading(false); }
    else { setShowParcial(false); router.refresh(); }
    setLoading(false);
  }

  // ── Colores y textos según estado ──────────────────────────────────

  const cardStyle: Record<string, string> = {
    pendiente:        "border-yellow-200 bg-yellow-50",
    aprobada:         "border-green-200 bg-green-50",
    aprobada_parcial: "border-amber-200 bg-amber-50",
    rechazada:        "border-red-200 bg-red-50",
  };

  const iconos: Record<string, string> = {
    pendiente:        "⏳",
    aprobada:         "✅",
    aprobada_parcial: "⚠️",
    rechazada:        "❌",
  };

  const etiquetas: Record<string, string> = {
    pendiente:        "Pendiente de revisión técnica",
    aprobada:         "Autorizado",
    aprobada_parcial: "Autorizado parcialmente",
    rechazada:        "No autorizado",
  };

  // ── Render panel ───────────────────────────────────────────────────

  return (
    <>
      <div className={cn("rounded-xl border p-5 space-y-3", cardStyle[estado] ?? "border-gray-200 bg-gray-50")}>
        {/* Encabezado */}
        <div className="flex items-center gap-2">
          <span>{iconos[estado] ?? "🔲"}</span>
          <h4 className="text-sm font-semibold text-gray-900">Autorización Técnica</h4>
        </div>

        {/* Estado */}
        <div>
          <p className={cn("text-sm font-medium", {
            "text-yellow-700": estado === "pendiente",
            "text-green-700":  estado === "aprobada",
            "text-amber-700":  estado === "aprobada_parcial",
            "text-red-700":    estado === "rechazada",
          })}>
            {etiquetas[estado] ?? estado}
          </p>

          {aprobador && fecha && (
            <p className="text-xs text-gray-500 mt-0.5">
              Por {aprobador.nombre} {aprobador.apellido} · {formatDate(fecha as Date)}
            </p>
          )}

          {comentario && (
            <p className="mt-1.5 text-xs text-gray-600 italic">"{comentario}"</p>
          )}
        </div>

        {/* Resumen de ítems para aprobación parcial (vista) */}
        {estado === "aprobada_parcial" && itemsAutTec.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-amber-200">
            {items.map((item) => {
              const dec = itemsAutTec.find((d) => d.itemPedidoId === item.id);
              const decEstado = dec?.estado ?? "ok";
              return (
                <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-gray-600 truncate flex-1">
                    {item.orden + 1}. {item.presentacion}
                  </span>
                  {decEstado === "ok" && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      ✓ OK
                    </span>
                  )}
                  {decEstado === "denegado" && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                      ✗ Denegado
                    </span>
                  )}
                  {decEstado === "modificado" && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      → {dec?.nuevaCantidad} {item.unidadMedida}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Botones de acción (solo pendiente + canAct) */}
        {canAct && estado === "pendiente" && (
          <div className="pt-1 flex flex-col gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => openModal("aprobar")}
              className="w-full justify-center"
            >
              ✓ Autorizar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openModal("parcial")}
              className="w-full justify-center"
            >
              ⚠ Autorización parcial
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => openModal("rechazar")}
              className="w-full justify-center"
            >
              ✗ No autorizar
            </Button>
          </div>
        )}
      </div>

      {/* ── Modal: Autorizar total ─────────────────────────────────────── */}
      <Modal open={showAprobar} onClose={() => setShowAprobar(false)} title="Autorizar pedido" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Confirmás que todos los ítems están aprobados técnicamente.</p>
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
            <Button size="sm" loading={loading} onClick={handleAprobar}>Confirmar autorización</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: No autorizar ────────────────────────────────────────── */}
      <Modal open={showRechazar} onClose={() => setShowRechazar(false)} title="No autorizar pedido" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Indicá el motivo del rechazo técnico.</p>
          <Textarea
            label="Motivo *"
            value={comentarioModal}
            onChange={(e) => { setComentarioModal(e.target.value); setError(""); }}
            placeholder="Ej: Material no disponible en el catálogo aprobado..."
            required
            rows={3}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowRechazar(false)}>Cancelar</Button>
            <Button variant="danger" size="sm" loading={loading} onClick={handleRechazar}>
              Confirmar rechazo
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Autorización parcial ────────────────────────────────── */}
      <Modal open={showParcial} onClose={() => setShowParcial(false)} title="Revisión de ítems — Autorización parcial" size="lg">
        <div className="space-y-5">
          <p className="text-sm text-gray-500">
            Revisá cada ítem y decidí si está <strong>aprobado</strong>, <strong>denegado</strong> o si necesita <strong>modificar la cantidad</strong>.
          </p>

          {/* Tabla de ítems con decisiones */}
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
            {/* Cabecera */}
            <div className="grid grid-cols-[auto_1fr_auto] gap-3 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500">
              <span>#</span>
              <span>Ítem</span>
              <span className="text-right">Decisión</span>
            </div>

            {items.map((item, i) => {
              const d = decisiones[item.id] ?? { estado: "ok", nuevaCantidad: String(item.cantidad) };

              return (
                <div
                  key={item.id}
                  className={cn(
                    "grid grid-cols-[auto_1fr_auto] gap-3 px-4 py-3 items-center transition-colors",
                    d.estado === "denegado"  && "bg-red-50",
                    d.estado === "modificado" && "bg-amber-50",
                  )}
                >
                  {/* Número */}
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>

                  {/* Info del ítem */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{item.presentacion}</p>
                    <p className="text-xs text-gray-400">{item.categoria.nombre} · {item.subCategoria.nombre}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Cantidad original: <strong>{item.cantidad} {item.unidadMedida}</strong>
                    </p>
                  </div>

                  {/* Controles de decisión */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* ✓ OK */}
                    <button
                      type="button"
                      onClick={() => setDecision(item.id, "ok")}
                      title="Aprobar ítem"
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all",
                        d.estado === "ok"
                          ? "bg-green-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600"
                      )}
                    >
                      ✓
                    </button>

                    {/* ✗ Denegar */}
                    <button
                      type="button"
                      onClick={() => setDecision(item.id, "denegado")}
                      title="Denegar ítem"
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all",
                        d.estado === "denegado"
                          ? "bg-red-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      )}
                    >
                      ✗
                    </button>

                    {/* ✏ Modificar cantidad */}
                    <button
                      type="button"
                      onClick={() => setDecision(item.id, "modificado")}
                      title="Modificar cantidad"
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all",
                        d.estado === "modificado"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
                      )}
                    >
                      ✏
                    </button>

                    {/* Input de nueva cantidad (solo cuando "modificado") */}
                    {d.estado === "modificado" && (
                      <div className="flex items-center gap-1 ml-1">
                        <input
                          type="number"
                          min={0.01}
                          step="any"
                          value={d.nuevaCantidad}
                          onChange={(e) => setCantidad(item.id, e.target.value)}
                          className="w-20 text-sm text-right px-2 py-1.5 rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                          autoFocus
                        />
                        <span className="text-xs text-amber-700">{item.unidadMedida}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen rápido */}
          <div className="flex gap-4 text-xs text-gray-500">
            <span>
              <span className="font-semibold text-green-600">
                {Object.values(decisiones).filter((d) => d.estado === "ok").length}
              </span> aprobados
            </span>
            <span>
              <span className="font-semibold text-amber-600">
                {Object.values(decisiones).filter((d) => d.estado === "modificado").length}
              </span> modificados
            </span>
            <span>
              <span className="font-semibold text-red-600">
                {Object.values(decisiones).filter((d) => d.estado === "denegado").length}
              </span> denegados
            </span>
          </div>

          {/* Comentario */}
          <Textarea
            label="Comentario técnico (opcional)"
            value={comentarioModal}
            onChange={(e) => setComentarioModal(e.target.value)}
            placeholder="Observaciones sobre los cambios realizados..."
            rows={2}
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowParcial(false)}>Cancelar</Button>
            <Button size="sm" loading={loading} onClick={handleParcial}>
              Confirmar autorización parcial
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
