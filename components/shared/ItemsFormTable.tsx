"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/SelectField";

export interface ItemRow {
  id: string;
  cantidad: number;
  unidadMedida: string;
  descripcion: string;
  marca: string;
  itemPedidoId?: string;
}

const UNIDADES = [
  "unidad", "kg", "litro", "metro", "caja", "bolsa",
  "rollo", "pallet", "servicio", "ml", "par", "juego",
];

interface ItemsFormTableProps {
  items: ItemRow[];
  onChange: (items: ItemRow[]) => void;
  readOnly?: boolean;
}

function newRow(): ItemRow {
  return { id: crypto.randomUUID(), cantidad: 1, unidadMedida: "unidad", descripcion: "", marca: "" };
}

export function ItemsFormTable({ items, onChange, readOnly }: ItemsFormTableProps) {
  function update(id: string, field: keyof ItemRow, value: string | number) {
    onChange(items.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function remove(id: string) {
    onChange(items.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          Ítems <span className="text-red-500">*</span>
        </p>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...items, newRow()])}
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

      {items.map((row, i) => (
        <div
          key={row.id}
          className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 items-end"
        >
          {/* Orden */}
          <div className="col-span-1 text-center">
            <span className="text-xs text-gray-400 font-mono">{i + 1}</span>
          </div>

          {/* Cantidad */}
          <div className="col-span-2">
            <Input
              label={i === 0 ? "Cant." : undefined}
              type="number"
              min={0.01}
              step="any"
              value={row.cantidad}
              onChange={(e) => update(row.id, "cantidad", parseFloat(e.target.value) || 0)}
              readOnly={readOnly}
              required
            />
          </div>

          {/* Unidad */}
          <div className="col-span-2">
            <SelectField
              label={i === 0 ? "Unidad" : undefined}
              value={row.unidadMedida}
              onChange={(e) => update(row.id, "unidadMedida", e.target.value)}
              options={UNIDADES.map((u) => ({ value: u, label: u }))}
              disabled={readOnly}
            />
          </div>

          {/* Descripción */}
          <div className="col-span-4">
            <Input
              label={i === 0 ? "Descripción" : undefined}
              value={row.descripcion}
              onChange={(e) => update(row.id, "descripcion", e.target.value)}
              placeholder="Ej: Aceite hidráulico ISO 46"
              readOnly={readOnly}
              required
            />
          </div>

          {/* Marca */}
          <div className="col-span-2">
            <Input
              label={i === 0 ? "Marca" : undefined}
              value={row.marca}
              onChange={(e) => update(row.id, "marca", e.target.value)}
              placeholder="Opcional"
              readOnly={readOnly}
            />
          </div>

          {/* Delete */}
          {!readOnly && (
            <div className="col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => remove(row.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar ítem"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
