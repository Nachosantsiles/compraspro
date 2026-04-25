"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/SelectField";
import { Textarea } from "@/components/ui/Textarea";
import { ItemsFormTable, type ItemRow } from "@/components/shared/ItemsFormTable";
import { crearOPI } from "@/lib/actions/opis";

interface Empresa {
  id: string;
  nombre: string;
  color: string;
  departamentos: Array<{
    id: string;
    codigo: string;
    nombre: string;
    centrosCosto: Array<{ id: string; codigo: string; descripcion: string }>;
  }>;
}

interface Finca { id: string; nombre: string; empresaId: string; }
interface CCFinca { id: string; tipo: string; categoria: string; subcategoria: string | null; descripcion: string; }

interface PedidoInicial {
  id: string;
  numero: string;
  empresaId: string;
  solicitante: string;
  descripcion: string;
  urgencia: string;
  items: Array<{ id: string; cantidad: number; unidadMedida: string; descripcion: string; marca: string | null; }>;
}

interface OPIFormProps {
  empresas: Empresa[];
  fincas: Finca[];
  ccFincas: CCFinca[];
  pedidoInicial?: PedidoInicial;
  defaultEmpresaId?: string;
  userName?: string;
}

const FINCA_DEPTS = ["FINCA", "ADMINISTRACION", "TALLER"];

export function OPIForm({ empresas, fincas, ccFincas, pedidoInicial, defaultEmpresaId, userName }: OPIFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initEmpresa = pedidoInicial?.empresaId ?? defaultEmpresaId ?? "";
  const [empresaId, setEmpresaId] = useState(initEmpresa);
  const [deptId, setDeptId] = useState("");
  const [ccId, setCcId] = useState("");
  const [fincaId, setFincaId] = useState("");
  const [fincaDept, setFincaDept] = useState("");
  const [tipoImp, setTipoImp] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [ccFincaId, setCcFincaId] = useState("");

  const [solicitante, setSolicitante] = useState(pedidoInicial?.solicitante ?? userName ?? "");
  const [descripcion, setDescripcion] = useState(pedidoInicial?.descripcion ?? "");
  const [observaciones, setObservaciones] = useState("");
  const [urgencia, setUrgencia] = useState(pedidoInicial?.urgencia ?? "Normal");

  const [items, setItems] = useState<ItemRow[]>(
    pedidoInicial?.items.length
      ? pedidoInicial.items.map((i) => ({
          id: crypto.randomUUID(),
          cantidad: i.cantidad,
          unidadMedida: i.unidadMedida,
          descripcion: i.descripcion,
          marca: i.marca ?? "",
          itemPedidoId: i.id,
        }))
      : [{ id: crypto.randomUUID(), cantidad: 1, unidadMedida: "unidad", descripcion: "", marca: "" }]
  );

  const empresa = empresas.find((e) => e.id === empresaId);
  const esFincas = empresaId === "fincas_grupo_cazorla";
  const depts = empresa?.departamentos ?? [];
  const dept = depts.find((d) => d.id === deptId);
  const ccs = dept?.centrosCosto ?? [];
  const fincasFiltradas = fincas.filter((f) => f.empresaId === "fincas_grupo_cazorla");
  const categorias = esFincas ? Array.from(new Set(ccFincas.filter((c) => c.tipo === tipoImp).map((c) => c.categoria))) : [];
  const subcategorias = esFincas
    ? ccFincas.filter((c) => c.tipo === tipoImp && c.categoria === categoria && c.subcategoria).map((c) => c.subcategoria as string)
    : [];

  function handleCatChange(cat: string) {
    setCategoria(cat); setSubcategoria(""); setCcFincaId("");
    const match = ccFincas.find((c) => c.tipo === tipoImp && c.categoria === cat && !c.subcategoria);
    if (match) setCcFincaId(match.id);
  }
  function handleSubcatChange(sub: string) {
    setSubcategoria(sub);
    const match = ccFincas.find((c) => c.tipo === tipoImp && c.categoria === categoria && c.subcategoria === sub);
    if (match) setCcFincaId(match.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!empresaId) return setError("Seleccioná una empresa");
    if (!esFincas && !ccId) return setError("Seleccioná un centro de costo");
    if (esFincas && !ccFincaId) return setError("Seleccioná la imputación de costo");
    if (items.some((i) => !i.descripcion.trim())) return setError("Completá la descripción de todos los ítems");

    setLoading(true);
    const res = await crearOPI({
      pedidoId: pedidoInicial?.id,
      empresaId,
      fincaId: esFincas ? fincaId : undefined,
      ccId: !esFincas ? ccId : undefined,
      ccFincaId: esFincas ? ccFincaId : undefined,
      solicitante,
      descripcion,
      observaciones: observaciones || undefined,
      urgencia,
      items: items.map((i) => ({
        cantidad: i.cantidad,
        unidadMedida: i.unidadMedida,
        descripcion: i.descripcion,
        marca: i.marca || undefined,
        itemPedidoId: i.itemPedidoId,
      })),
    });

    if (res.error) { setError(res.error); setLoading(false); }
    else router.push(`/dashboard/opis/${res.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Pedido origen */}
      {pedidoInicial && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Pedido de origen</p>
          <p className="text-sm font-mono text-blue-900 mt-0.5">{pedidoInicial.numero}</p>
          <p className="text-sm text-blue-700">{pedidoInicial.descripcion}</p>
        </div>
      )}

      {/* Empresa e imputación */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Empresa e imputación</h3>
        <SelectField
          label="Empresa"
          value={empresaId}
          onChange={(e) => {
            setEmpresaId(e.target.value);
            setDeptId(""); setCcId(""); setFincaId(""); setTipoImp(""); setCategoria(""); setSubcategoria(""); setCcFincaId("");
          }}
          options={empresas.map((e) => ({ value: e.id, label: e.nombre }))}
          placeholder="Seleccioná empresa..."
          required
          disabled={!!pedidoInicial}
        />

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

        {esFincas && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Finca" value={fincaId} onChange={(e) => setFincaId(e.target.value)}
                options={fincasFiltradas.map((f) => ({ value: f.id, label: f.nombre }))} placeholder="Seleccioná..." required />
              <SelectField label="Departamento" value={fincaDept} onChange={(e) => setFincaDept(e.target.value)}
                options={FINCA_DEPTS.map((d) => ({ value: d, label: d }))} placeholder="Seleccioná..." required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <SelectField label="Tipo imputación" value={tipoImp}
                onChange={(e) => { setTipoImp(e.target.value); setCategoria(""); setSubcategoria(""); setCcFincaId(""); }}
                options={["GASTOS", "INVERSIONES"].map((t) => ({ value: t, label: t }))} placeholder="Seleccioná..." required />
              <SelectField label="Categoría" value={categoria} onChange={(e) => handleCatChange(e.target.value)}
                options={categorias.map((c) => ({ value: c, label: c.replace(/_/g, " ") }))} placeholder="Seleccioná..." disabled={!tipoImp} required />
              {subcategorias.length > 0 && (
                <SelectField label="Subcategoría" value={subcategoria} onChange={(e) => handleSubcatChange(e.target.value)}
                  options={subcategorias.map((s) => ({ value: s, label: s }))} placeholder="Seleccioná..." required />
              )}
            </div>
          </>
        )}
      </div>

      {/* Datos generales */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Datos de la OPI</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Solicitante" value={solicitante} onChange={(e) => setSolicitante(e.target.value)} required />
          <SelectField label="Urgencia" value={urgencia} onChange={(e) => setUrgencia(e.target.value)}
            options={[{ value: "Normal", label: "Normal" }, { value: "Alta", label: "Alta" }, { value: "Critica", label: "Crítica" }]} />
        </div>
        <Textarea label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
        <Textarea label="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} hint="Opcional" />
      </div>

      {/* Ítems */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ItemsFormTable items={items} onChange={setItems} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>Crear OPI</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}
