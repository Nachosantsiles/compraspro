"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/SelectField";
import { Textarea } from "@/components/ui/Textarea";
import { PedidoItemsTable, type ItemPedidoRow, type CatData } from "@/components/pedidos/PedidoItemsTable";
import { crearPedido } from "@/lib/actions/pedidos";

interface Empresa {
  id: string;
  nombre: string;
  tipo: string;
  color: string;
  estructura: string;
  departamentos: Array<{
    id: string;
    codigo: string;
    nombre: string;
    centrosCosto: Array<{ id: string; codigo: string; descripcion: string }>;
  }>;
}

interface Finca {
  id: string;
  nombre: string;
  empresaId: string;
}

interface CCFinca {
  id: string;
  tipo: string;
  categoria: string;
  subcategoria: string | null;
  descripcion: string;
}

interface PedidoFormProps {
  empresas: Empresa[];
  fincas: Finca[];
  ccFincas: CCFinca[];
  categorias: CatData[];
  unidades: string[];
  defaultEmpresaId?: string;
  userName?: string;
}

const FINCA_DEPTS = ["FINCA", "ADMINISTRACION", "TALLER"];

export function PedidoForm({ empresas, fincas, ccFincas, categorias, unidades, defaultEmpresaId, userName }: PedidoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [empresaId, setEmpresaId] = useState(defaultEmpresaId ?? "");
  const [deptId, setDeptId] = useState("");
  const [ccId, setCcId] = useState("");
  const [fincaId, setFincaId] = useState("");
  const [fincaDept, setFincaDept] = useState("");
  const [tipoImp, setTipoImp] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [ccFincaId, setCcFincaId] = useState("");

  const [solicitante, setSolicitante] = useState(userName ?? "");
  const [descripcion, setDescripcion] = useState("");
  const [urgencia, setUrgencia] = useState("Media");
  const [items, setItems] = useState<ItemPedidoRow[]>([
    { id: crypto.randomUUID(), categoriaId: "", subCategoriaId: "", presentacion: "", unidadMedida: unidades[0] ?? "unid", cantidad: 1 },
  ]);

  const empresa = empresas.find((e) => e.id === empresaId);
  const esFincas = empresaId === "fincas_grupo_cazorla";
  const depts = empresa?.departamentos ?? [];
  const dept = depts.find((d) => d.id === deptId);
  const ccs = dept?.centrosCosto ?? [];

  const fincasFiltradas = fincas.filter((f) => f.empresaId === "fincas_grupo_cazorla");
  const tipos = esFincas ? ["GASTOS", "INVERSIONES"] : [];
  const categoriasCC = esFincas
    ? Array.from(new Set(ccFincas.filter((c) => c.tipo === tipoImp).map((c) => c.categoria)))
    : [];
  const subcategoriasCC = esFincas
    ? ccFincas
        .filter((c) => c.tipo === tipoImp && c.categoria === categoria && c.subcategoria)
        .map((c) => c.subcategoria as string)
    : [];

  function handleCategoriaChange(cat: string) {
    setCategoria(cat);
    setSubcategoria("");
    setCcFincaId("");
    const match = ccFincas.find((c) => c.tipo === tipoImp && c.categoria === cat && !c.subcategoria);
    if (match) setCcFincaId(match.id);
  }

  function handleSubcategoriaChange(sub: string) {
    setSubcategoria(sub);
    const match = ccFincas.find(
      (c) => c.tipo === tipoImp && c.categoria === categoria && c.subcategoria === sub
    );
    if (match) setCcFincaId(match.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!empresaId) return setError("Seleccioná una empresa");
    if (!esFincas && !ccId) return setError("Seleccioná un centro de costo");
    if (esFincas && !ccFincaId) return setError("Seleccioná la imputación de costo");
    if (items.length === 0) return setError("Agregá al menos un ítem");

    const itemInvalido = items.find(
      (i) => !i.categoriaId || !i.subCategoriaId || !i.presentacion.trim() || i.cantidad <= 0
    );
    if (itemInvalido) return setError("Completá todos los campos de cada ítem");

    setLoading(true);
    const res = await crearPedido({
      empresaId,
      fincaId: esFincas ? fincaId : undefined,
      ccId: !esFincas ? ccId : undefined,
      ccFincaId: esFincas ? ccFincaId : undefined,
      solicitante,
      descripcion,
      urgencia,
      items: items.map((i) => ({
        cantidad: i.cantidad,
        unidadMedida: i.unidadMedida,
        presentacion: i.presentacion,
        categoriaId: i.categoriaId,
        subCategoriaId: i.subCategoriaId,
      })),
    });

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push(`/dashboard/pedidos/${res.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Empresa e imputación */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Empresa e imputación</h3>

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Empresa"
            value={empresaId}
            onChange={(e) => {
              setEmpresaId(e.target.value);
              setDeptId(""); setCcId(""); setFincaId("");
              setTipoImp(""); setCategoria(""); setSubcategoria(""); setCcFincaId("");
            }}
            options={empresas.map((e) => ({ value: e.id, label: e.nombre }))}
            placeholder="Seleccioná empresa..."
            required
          />
        </div>

        {/* Industrial: dept → CC */}
        {empresaId && !esFincas && (
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Departamento"
              value={deptId}
              onChange={(e) => { setDeptId(e.target.value); setCcId(""); }}
              options={depts.map((d) => ({ value: d.id, label: `${d.codigo} – ${d.nombre}` }))}
              placeholder="Seleccioná..."
              required
            />
            <SelectField
              label="Centro de costo"
              value={ccId}
              onChange={(e) => setCcId(e.target.value)}
              options={ccs.map((c) => ({ value: c.id, label: `${c.codigo} – ${c.descripcion}` }))}
              placeholder="Seleccioná..."
              disabled={!deptId}
              required
            />
          </div>
        )}

        {/* Fincas: finca → dept → tipo → cat → subcat */}
        {esFincas && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Finca"
                value={fincaId}
                onChange={(e) => setFincaId(e.target.value)}
                options={fincasFiltradas.map((f) => ({ value: f.id, label: f.nombre }))}
                placeholder="Seleccioná finca..."
                required
              />
              <SelectField
                label="Departamento"
                value={fincaDept}
                onChange={(e) => setFincaDept(e.target.value)}
                options={FINCA_DEPTS.map((d) => ({ value: d, label: d }))}
                placeholder="Seleccioná..."
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <SelectField
                label="Tipo imputación"
                value={tipoImp}
                onChange={(e) => {
                  setTipoImp(e.target.value);
                  setCategoria(""); setSubcategoria(""); setCcFincaId("");
                }}
                options={tipos.map((t) => ({ value: t, label: t }))}
                placeholder="Seleccioná..."
                required
              />
              <SelectField
                label="Categoría"
                value={categoria}
                onChange={(e) => handleCategoriaChange(e.target.value)}
                options={categoriasCC.map((c) => ({ value: c, label: c.replace(/_/g, " ") }))}
                placeholder="Seleccioná..."
                disabled={!tipoImp}
                required
              />
              {subcategoriasCC.length > 0 && (
                <SelectField
                  label="Subcategoría"
                  value={subcategoria}
                  onChange={(e) => handleSubcategoriaChange(e.target.value)}
                  options={subcategoriasCC.map((s) => ({ value: s, label: s }))}
                  placeholder="Seleccioná..."
                  required
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Datos generales */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Datos del pedido</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">Solicitante</p>
            <div className="flex items-center gap-2 h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">{solicitante}</span>
              <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Usuario activo</span>
            </div>
          </div>
          <SelectField
            label="Urgencia"
            value={urgencia}
            onChange={(e) => setUrgencia(e.target.value)}
            options={[
              { value: "Baja", label: "Baja" },
              { value: "Media", label: "Media" },
              { value: "Critica", label: "Crítica" },
            ]}
          />
        </div>

        <Textarea
          label="Motivo del pedido"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Motivo o contexto de la compra..."
          required
        />
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <PedidoItemsTable
          items={items}
          onChange={setItems}
          categorias={categorias}
          unidades={unidades}
          empresaTipo={empresa?.tipo ?? ""}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          Crear pedido
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
