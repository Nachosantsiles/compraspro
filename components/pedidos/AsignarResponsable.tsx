"use client";

import { useState, useTransition } from "react";
import { asignarResponsable } from "@/lib/actions/pedidos";

interface Comprador {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
}

interface Props {
  pedidoId: string;
  responsableActual: { id: string; nombre: string; apellido: string } | null;
  compradores: Comprador[];
}

export function AsignarResponsable({ pedidoId, responsableActual, compradores }: Props) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(responsableActual?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSave() {
    setError("");
    startTransition(async () => {
      const res = await asignarResponsable(pedidoId, selected || null);
      if (res.error) { setError(res.error); }
      else { setEditing(false); }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-800 text-sm">
          {responsableActual
            ? `${responsableActual.nombre} ${responsableActual.apellido}`
            : <span className="text-gray-400 italic">Sin asignar</span>}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-blue-600 hover:underline"
        >
          {responsableActual ? "Cambiar" : "Asignar"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900"
        disabled={isPending}
      >
        <option value="">— Sin asignar —</option>
        {compradores.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre} {c.apellido} {c.rol === "admin" ? "(admin)" : ""}
          </option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={isPending}
        className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Guardar"}
      </button>
      <button
        onClick={() => { setEditing(false); setSelected(responsableActual?.id ?? ""); }}
        disabled={isPending}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        Cancelar
      </button>
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
    </div>
  );
}
