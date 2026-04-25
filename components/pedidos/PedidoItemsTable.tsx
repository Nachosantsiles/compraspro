"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/SelectField";
import { crearCategoria, crearSubCategoria } from "@/lib/actions/categorias";
import { crearUnidad } from "@/lib/actions/unidades";

export interface ItemPedidoRow {
  id: string;
  categoriaId: string;
  subCategoriaId: string;
  presentacion: string;
  unidadMedida: string;
  cantidad: number;
  itemPedidoId?: string;
}

interface SubCat {
  id: string;
  nombre: string;
}

export interface CatData {
  id: string;
  nombre: string;
  tipo: string;
  subcategorias: SubCat[];
}

interface PedidoItemsTableProps {
  items: ItemPedidoRow[];
  onChange: (items: ItemPedidoRow[]) => void;
  categorias: CatData[];
  unidades: string[];           // nombres de unidades disponibles
  empresaTipo: string;          // "industrial" | "agropecuario" | ""
  readOnly?: boolean;
}

const NEW_CAT_VALUE  = "__nueva_categoria__";
const NEW_SUB_VALUE  = "__nueva_subcategoria__";
const NEW_UNID_VALUE = "__nueva_unidad__";

type InlineState = Record<string, { open: boolean; nombre: string; loading: boolean }>;

function newRow(defaultUnidad: string): ItemPedidoRow {
  return {
    id: crypto.randomUUID(),
    categoriaId: "",
    subCategoriaId: "",
    presentacion: "",
    unidadMedida: defaultUnidad || "unid",
    cantidad: 1,
  };
}

export function PedidoItemsTable({
  items,
  onChange,
  categorias: initialCategorias,
  unidades: initialUnidades,
  empresaTipo,
  readOnly,
}: PedidoItemsTableProps) {
  // ── Estado local (crece cuando el usuario agrega nuevos) ───────────
  const [categorias, setCategorias] = useState<CatData[]>(initialCategorias);
  const [unidades, setUnidades]     = useState<string[]>(initialUnidades);

  const [newCatState,  setNewCatState]  = useState<InlineState>({});
  const [newSubState,  setNewSubState]  = useState<InlineState>({});
  const [newUnidState, setNewUnidState] = useState<InlineState>({});

  // ── Filtro categorías por empresa ──────────────────────────────────
  const catsFiltradas = categorias.filter((c) => {
    if (!empresaTipo) return true;
    const tipos = empresaTipo === "agropecuario" ? ["finca", "todas"] : ["fabrica", "todas"];
    return tipos.includes(c.tipo);
  });
  const tipoNuevaCat = empresaTipo === "agropecuario" ? "finca" : "fabrica";

  // ── Helpers ────────────────────────────────────────────────────────
  function update(id: string, field: keyof ItemPedidoRow, value: string | number) {
    onChange(
      items.map((r) => {
        if (r.id !== id) return r;
        if (field === "categoriaId") return { ...r, categoriaId: value as string, subCategoriaId: "" };
        return { ...r, [field]: value };
      })
    );
  }

  function remove(id: string) {
    onChange(items.filter((r) => r.id !== id));
  }

  // ── CATEGORÍA ──────────────────────────────────────────────────────
  function handleCatChange(rowId: string, value: string) {
    if (value === NEW_CAT_VALUE) {
      setNewCatState((s) => ({ ...s, [rowId]: { open: true, nombre: "", loading: false } }));
      return;
    }
    update(rowId, "categoriaId", value);
  }

  async function handleSaveNewCat(rowId: string) {
    const state = newCatState[rowId];
    if (!state?.nombre.trim()) return;
    setNewCatState((s) => ({ ...s, [rowId]: { ...s[rowId], loading: true } }));

    const res = await crearCategoria(state.nombre.trim(), tipoNuevaCat);
    if (res.error) {
      alert(res.error);
      setNewCatState((s) => ({ ...s, [rowId]: { ...s[rowId], loading: false } }));
      return;
    }
    const nueva = res.categoria!;
    setCategorias((prev) => [...prev, { id: nueva.id, nombre: nueva.nombre, tipo: nueva.tipo, subcategorias: [] }]);
    update(rowId, "categoriaId", nueva.id);
    setNewCatState((s) => ({ ...s, [rowId]: { open: false, nombre: "", loading: false } }));
  }

  function cancelNewCat(rowId: string) {
    setNewCatState((s) => ({ ...s, [rowId]: { open: false, nombre: "", loading: false } }));
  }

  // ── SUBCATEGORÍA ───────────────────────────────────────────────────
  function handleSubChange(rowId: string, value: string) {
    if (value === NEW_SUB_VALUE) {
      setNewSubState((s) => ({ ...s, [rowId]: { open: true, nombre: "", loading: false } }));
      return;
    }
    update(rowId, "subCategoriaId", value);
  }

  async function handleSaveNewSub(rowId: string, categoriaId: string) {
    const state = newSubState[rowId];
    if (!state?.nombre.trim()) return;
    setNewSubState((s) => ({ ...s, [rowId]: { ...s[rowId], loading: true } }));

    const res = await crearSubCategoria(state.nombre.trim(), categoriaId);
    if (res.error) {
      alert(res.error);
      setNewSubState((s) => ({ ...s, [rowId]: { ...s[rowId], loading: false } }));
      return;
    }
    const nuevaSub = res.subCategoria!;
    setCategorias((prev) =>
      prev.map((c) =>
        c.id === categoriaId
          ? { ...c, subcategorias: [...c.subcategorias, { id: nuevaSub.id, nombre: nuevaSub.nombre }] }
          : c
      )
    );
    update(rowId, "subCategoriaId", nuevaSub.id);
    setNewSubState((s) => ({ ...s, [rowId]: { open: false, nombre: "", loading: false } }));
  }

  function cancelNewSub(rowId: string) {
    setNewSubState((s) => ({ ...s, [rowId]: { open: false, nombre: "", loading: false } }));
  }

  // ── UNIDAD DE MEDIDA ───────────────────────────────────────────────
  function handleUnidChange(rowId: string, value: string) {
    if (value === NEW_UNID_VALUE) {
      setNewUnidState((s) => ({ ...s, [rowId]: { open: true, nombre: "", loading: false } }));
      return;
    }
    update(rowId, "unidadMedida", value);
  }

  async function handleSaveNewUnid(rowId: string) {
    const state = newUnidState[rowId];
    if (!state?.nombre.trim()) return;
    setNewUnidState((s) => ({ ...s, [rowId]: { ...s[rowId], loading: true } }));

    const res = await crearUnidad(state.nombre.trim());
    if (res.error) {
      alert(res.error);
      setNewUnidState((s) => ({ ...s, [rowId]: { ...s[rowId], loading: false } }));
      return;
    }
    const nuevaUnidad = res.unidad!.nombre;
    // Agregar al listado local si no estaba
    setUnidades((prev) => prev.includes(nuevaUnidad) ? prev : [...prev, nuevaUnidad].sort());
    update(rowId, "unidadMedida", nuevaUnidad);
    setNewUnidState((s) => ({ ...s, [rowId]: { open: false, nombre: "", loading: false } }));
  }

  function cancelNewUnid(rowId: string) {
    setNewUnidState((s) => ({ ...s, [rowId]: { open: false, nombre: "", loading: false } }));
  }

  // ── Render ─────────────────────────────────────────────────────────
  const defaultUnidad = unidades[0] ?? "unid";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">
          Ítems <span className="text-red-500">*</span>
        </p>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...items, newRow(defaultUnidad)])}
          >
            + Agregar ítem
          </Button>
        )}
      </div>

      {items.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Sin ítems. Agregá al menos uno.</p>
        </div>
      )}

      {items.map((row, i) => {
        const catSel       = categorias.find((c) => c.id === row.categoriaId);
        const subsDisp     = catSel?.subcategorias ?? [];
        const newCat       = newCatState[row.id];
        const newSub       = newSubState[row.id];
        const newUnid      = newUnidState[row.id];

        return (
          <div key={row.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            {/* Encabezado del ítem */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">Ítem {i + 1}</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar ítem"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {/* Fila 1: Categoría → Subcategoría */}
            <div className="grid grid-cols-2 gap-3">
              {/* Categoría */}
              <div>
                {newCat?.open ? (
                  <InlineInput
                    label="Nueva categoría"
                    placeholder="Nombre de la categoría..."
                    value={newCat.nombre}
                    loading={newCat.loading}
                    onChange={(v) => setNewCatState((s) => ({ ...s, [row.id]: { ...s[row.id], nombre: v } }))}
                    onSave={() => handleSaveNewCat(row.id)}
                    onCancel={() => cancelNewCat(row.id)}
                  />
                ) : (
                  <SelectField
                    label="Categoría"
                    value={row.categoriaId}
                    onChange={(e) => handleCatChange(row.id, e.target.value)}
                    disabled={readOnly}
                    required
                    options={[
                      ...catsFiltradas.map((c) => ({ value: c.id, label: c.nombre })),
                      ...(readOnly ? [] : [{ value: NEW_CAT_VALUE, label: "＋ Agregar nueva categoría..." }]),
                    ]}
                    placeholder="Seleccioná categoría..."
                  />
                )}
              </div>

              {/* Subcategoría */}
              <div>
                {newSub?.open ? (
                  <InlineInput
                    label="Nueva subcategoría"
                    placeholder="Nombre de la subcategoría..."
                    value={newSub.nombre}
                    loading={newSub.loading}
                    onChange={(v) => setNewSubState((s) => ({ ...s, [row.id]: { ...s[row.id], nombre: v } }))}
                    onSave={() => handleSaveNewSub(row.id, row.categoriaId)}
                    onCancel={() => cancelNewSub(row.id)}
                  />
                ) : (
                  <SelectField
                    label="Subcategoría"
                    value={row.subCategoriaId}
                    onChange={(e) => handleSubChange(row.id, e.target.value)}
                    disabled={readOnly || !row.categoriaId}
                    required
                    options={[
                      ...subsDisp.map((s) => ({ value: s.id, label: s.nombre })),
                      ...(readOnly || !row.categoriaId ? [] : [{ value: NEW_SUB_VALUE, label: "＋ Agregar nueva subcategoría..." }]),
                    ]}
                    placeholder={!row.categoriaId ? "Primero elegí categoría" : "Seleccioná subcategoría..."}
                  />
                )}
              </div>
            </div>

            {/* Fila 2: Presentación → Unidad → Cantidad */}
            <div className="grid grid-cols-6 gap-3">
              {/* Presentación */}
              <div className="col-span-3">
                <Input
                  label="Presentación"
                  value={row.presentacion}
                  onChange={(e) => update(row.id, "presentacion", e.target.value)}
                  placeholder="Ej: Bidón 20L, Bolsa 50kg..."
                  readOnly={readOnly}
                  required
                />
              </div>

              {/* Unidad de medida */}
              <div className="col-span-2">
                {newUnid?.open ? (
                  <InlineInput
                    label="Nueva unidad"
                    placeholder="Ej: pallet, carga..."
                    value={newUnid.nombre}
                    loading={newUnid.loading}
                    onChange={(v) => setNewUnidState((s) => ({ ...s, [row.id]: { ...s[row.id], nombre: v } }))}
                    onSave={() => handleSaveNewUnid(row.id)}
                    onCancel={() => cancelNewUnid(row.id)}
                  />
                ) : (
                  <SelectField
                    label="Unidad de medida"
                    value={row.unidadMedida}
                    onChange={(e) => handleUnidChange(row.id, e.target.value)}
                    disabled={readOnly}
                    options={[
                      ...unidades.map((u) => ({ value: u, label: u })),
                      ...(readOnly ? [] : [{ value: NEW_UNID_VALUE, label: "＋ Agregar nueva unidad..." }]),
                    ]}
                  />
                )}
              </div>

              {/* Cantidad */}
              <div className="col-span-1">
                <Input
                  label="Cantidad"
                  type="number"
                  min={0.01}
                  step="any"
                  value={row.cantidad}
                  onChange={(e) => update(row.id, "cantidad", parseFloat(e.target.value) || 0)}
                  readOnly={readOnly}
                  required
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente auxiliar reutilizable ───────────────────────────────────
function InlineInput({
  label,
  placeholder,
  value,
  loading,
  onChange,
  onSave,
  onCancel,
}: {
  label: string;
  placeholder: string;
  value: string;
  loading: boolean;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-700 mb-1">{label}</p>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSave(); } if (e.key === "Escape") onCancel(); }}
          autoFocus
        />
        <Button type="button" size="sm" loading={loading} onClick={onSave}>
          Guardar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          ×
        </Button>
      </div>
    </div>
  );
}
