"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { crearProveedor, editarProveedor } from "@/lib/actions/proveedores";

interface Proveedor {
  id: string;
  nombre: string;
  cuit: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
}

interface ProveedorFormProps {
  proveedor?: Proveedor;
}

export function ProveedorForm({ proveedor }: ProveedorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState(proveedor?.nombre ?? "");
  const [cuit, setCuit] = useState(proveedor?.cuit ?? "");
  const [email, setEmail] = useState(proveedor?.email ?? "");
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? "");
  const [direccion, setDireccion] = useState(proveedor?.direccion ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = { nombre, cuit: cuit || undefined, email: email || undefined, telefono: telefono || undefined, direccion: direccion || undefined };

    const res = proveedor
      ? await editarProveedor(proveedor.id, data)
      : await crearProveedor(data);

    if (res.error) { setError(res.error); setLoading(false); return; }

    router.push("/dashboard/proveedores");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Nombre / Razón social *" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej: Distribuidora Técnica SA" />
        </div>
        <Input label="CUIT" value={cuit} onChange={(e) => setCuit(e.target.value)} placeholder="Ej: 30-12345678-9" />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@proveedor.com" />
        <Input label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: +54 11 1234-5678" />
        <Input label="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle 123, Ciudad" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {proveedor ? "Guardar cambios" : "Crear proveedor"}
        </Button>
      </div>
    </form>
  );
}
