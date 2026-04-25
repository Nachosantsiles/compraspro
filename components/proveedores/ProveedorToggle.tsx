"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleProveedorActivo } from "@/lib/actions/proveedores";
import { Button } from "@/components/ui/Button";

export function ProveedorToggle({ proveedorId, activo }: { proveedorId: string; activo: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await toggleProveedorActivo(proveedorId, !activo);
    router.refresh();
    setLoading(false);
  }

  return (
    <Button
      size="sm"
      variant={activo ? "danger" : "outline"}
      loading={loading}
      onClick={handle}
    >
      {activo ? "Desactivar" : "Activar"}
    </Button>
  );
}
