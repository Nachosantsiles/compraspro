"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { crearUsuario } from "@/lib/actions/usuarios";
import { ROL_LABELS } from "@/lib/utils";

interface Empresa {
  id: string;
  nombre: string;
}

export function UsuarioForm({ empresas }: { empresas: Empresa[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("comprador");
  const [empresaId, setEmpresaId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    setError("");

    const res = await crearUsuario({ nombre, apellido, email, password, rol, empresaId: empresaId || undefined });
    if (res.error) { setError(res.error); setLoading(false); return; }
    router.push("/dashboard/usuarios");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre *" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Juan" />
        <Input label="Apellido *" value={apellido} onChange={(e) => setApellido(e.target.value)} required placeholder="García" />
        <div className="col-span-2">
          <Input label="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="usuario@empresa.com" />
        </div>
        <div className="col-span-2">
          <Input label="Contraseña *" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Rol *</label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(ROL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Empresa</label>
          <select
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Sin empresa asignada —</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" loading={loading}>Crear usuario</Button>
      </div>
    </form>
  );
}
