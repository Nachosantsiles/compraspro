"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { marcarCompraDirecta } from "@/lib/actions/cotizaciones";

interface Props {
  opiId: string;
}

export function CompraDirectaButton({ opiId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirmar() {
    setLoading(true);
    setError("");
    const res = await marcarCompraDirecta(opiId);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => { setError(""); setOpen(true); }}>
        Compra directa
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Marcar como compra directa" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Esta OPI no requerirá cotizaciones. Se marcará como <strong>compra directa</strong> y
            avanzará directamente a <strong>Pendiente de Autorización Financiera</strong>.
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button size="sm" loading={loading} onClick={confirmar}>
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
