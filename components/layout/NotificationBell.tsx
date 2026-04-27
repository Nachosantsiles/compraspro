"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { NavIcon } from "./NavIcon";
import {
  getNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from "@/lib/actions/notificaciones";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

type Notif = {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  pedidoId: string | null;
  createdAt: Date;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.leida).length;

  async function fetchNotifs() {
    setLoading(true);
    const data = await getNotificaciones();
    setNotifs(data as Notif[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchNotifs();
    // Refresca cada 2 minutos en background
    const interval = setInterval(fetchNotifs, 120_000);
    return () => clearInterval(interval);
  }, []);

  // Cierra el panel al hacer click afuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleMarcarLeida(id: string) {
    startTransition(async () => {
      await marcarLeida(id);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
    });
  }

  function handleMarcarTodas() {
    startTransition(async () => {
      await marcarTodasLeidas();
      setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })));
    });
  }

  const tipoIcon: Record<string, string> = {
    pedido_vencido: "⏰",
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <NavIcon name="Bell" className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">
              Notificaciones {unread > 0 && `(${unread} sin leer)`}
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarcarTodas}
                className="text-xs text-blue-600 hover:underline"
              >
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                Cargando…
              </div>
            )}
            {!loading && notifs.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                Sin notificaciones
              </div>
            )}
            {!loading &&
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors ${
                    !n.leida ? "bg-blue-50/50" : ""
                  }`}
                >
                  <span className="text-lg leading-none mt-0.5">
                    {tipoIcon[n.tipo] ?? "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold text-gray-800 leading-snug ${!n.leida ? "font-bold" : ""}`}>
                      {n.titulo}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {n.mensaje}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">
                        {formatDate(n.createdAt, "dd/MM/yyyy HH:mm")}
                      </span>
                      {n.pedidoId && (
                        <Link
                          href={`/dashboard/pedidos/${n.pedidoId}`}
                          className="text-[10px] text-blue-600 hover:underline"
                          onClick={() => setOpen(false)}
                        >
                          Ver pedido →
                        </Link>
                      )}
                      {!n.leida && (
                        <button
                          onClick={() => handleMarcarLeida(n.id)}
                          className="text-[10px] text-gray-400 hover:text-gray-600"
                        >
                          ✓ Leída
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
