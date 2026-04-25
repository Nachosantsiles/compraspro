"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleUsuarioActivo } from "@/lib/actions/usuarios";

export function UsuarioToggle({ userId, activo }: { userId: string; activo: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await toggleUsuarioActivo(userId, !activo);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
        activo
          ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
          : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"
      } disabled:opacity-50`}
    >
      {loading ? "..." : activo ? "Activo" : "Inactivo"}
    </button>
  );
}
