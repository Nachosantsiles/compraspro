"use client";

import { useState, useTransition } from "react";
import { crearPresentacion, togglePresentacion } from "@/lib/actions/presentaciones";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/SelectField";
import { useRouter } from "next/navigation";

interface Presentacion {
  id: string;
  nombre: string;
  activo: boolean;
}

interface SubCategoria {
  id: string;
  nombre: string;
  presentaciones: Presentacion[];
}

interface Categoria {
  id: string;
  nombre: string;
  tipo: string;
  subcategorias: SubCategoria[];
}

interface Props {
  categorias: Categoria[];
}

const TIPO_LABEL: Record<string, string> = {
  fabrica: "Fábrica",
  finca: "Finca",
  todas: "Todas las empresas",
};

export function GestorPresentaciones({ categorias }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Modal "Agregar"
  const [showModal, setShowModal] = useState(false);
  const [catId, setCatId] = useState("");
  const [subId, setSubId] = useState("");
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Filtro de búsqueda
  const [busqueda, setBusqueda] = useState("");

  const catSel = categorias.find((c) => c.id === catId);
  const subsDisp = catSel?.subcategorias ?? [];

  async function handleGuardar() {
    if (!nombre.trim()) return setError("Ingresá un nombre");
    if (!subId) return setError("Seleccioná una subcategoría");
    setError("");
    setSaving(true);
    const res = await crearPresentacion(nombre.trim(), subId);
    setSaving(false);
    if (res.error) return setError(res.error);
    setNombre("");
    setCatId("");
    setSubId("");
    setShowModal(false);
    router.refresh();
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      await togglePresentacion(id);
      router.refresh();
    });
  }

  // Filtrar categorías/subs/presentaciones por búsqueda
  const query = busqueda.toLowerCase().trim();
  const catsFiltradas = categorias
    .map((cat) => ({
      ...cat,
      subcategorias: cat.subcategorias
        .map((sub) => ({
          ...sub,
          presentaciones: sub.presentaciones.filter(
            (p) =>
              !query ||
              p.nombre.toLowerCase().includes(query) ||
              sub.nombre.toLowerCase().includes(query) ||
              cat.nombre.toLowerCase().includes(query)
          ),
        }))
        .filter((sub) => !query || sub.presentaciones.length > 0),
    }))
    .filter((cat) => !query || cat.subcategorias.length > 0);

  const totalActivas = categorias
    .flatMap((c) => c.subcategorias)
    .flatMap((s) => s.presentaciones)
    .filter((p) => p.activo).length;

  return (
    <div className="space-y-5">
      {/* Barra superior */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar presentación, subcategoría o categoría..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Button onClick={() => { setShowModal(true); setError(""); }}>
          + Agregar tipo de presentación
        </Button>
      </div>

      <p className="text-xs text-gray-500">{totalActivas} presentaciones activas en total</p>

      {/* Lista agrupada */}
      <div className="space-y-6">
        {catsFiltradas.map((cat) => (
          <div key={cat.id}>
            {/* Header categoría */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {cat.nombre}
              </span>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                {TIPO_LABEL[cat.tipo] ?? cat.tipo}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
              {cat.subcategorias.map((sub) => (
                <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-3">{sub.nombre}</p>

                  {sub.presentaciones.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Sin presentaciones definidas</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {sub.presentaciones.map((p) => (
                        <div
                          key={p.id}
                          className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                            p.activo
                              ? "bg-blue-50 border-blue-200 text-blue-800"
                              : "bg-gray-100 border-gray-200 text-gray-400 line-through"
                          }`}
                        >
                          <span>{p.nombre}</span>
                          <button
                            onClick={() => handleToggle(p.id)}
                            className={`ml-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                              p.activo
                                ? "hover:bg-blue-200 text-blue-600"
                                : "hover:bg-gray-300 text-gray-500"
                            }`}
                            title={p.activo ? "Desactivar" : "Reactivar"}
                          >
                            {p.activo ? "×" : "↺"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {catsFiltradas.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No se encontraron resultados para "{busqueda}"
          </div>
        )}
      </div>

      {/* Modal agregar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Agregar tipo de presentación</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <SelectField
              label="Categoría"
              value={catId}
              onChange={(e) => { setCatId(e.target.value); setSubId(""); }}
              options={categorias.map((c) => ({ value: c.id, label: `${c.nombre} (${TIPO_LABEL[c.tipo] ?? c.tipo})` }))}
              placeholder="Seleccioná categoría..."
            />

            <SelectField
              label="Subcategoría"
              value={subId}
              onChange={(e) => setSubId(e.target.value)}
              options={subsDisp.map((s) => ({ value: s.id, label: s.nombre }))}
              placeholder={!catId ? "Primero elegí categoría" : "Seleccioná subcategoría..."}
              disabled={!catId}
            />

            <Input
              label="Nombre de la presentación"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Bidón 20L, Bolsa 50kg, Caja 12u..."
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleGuardar(); } }}
              autoFocus
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button onClick={handleGuardar} loading={saving} className="flex-1">
                Guardar
              </Button>
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
