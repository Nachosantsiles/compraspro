"use client";

import { usePathname } from "next/navigation";
import { NavIcon } from "./NavIcon";
import { NotificationBell } from "./NotificationBell";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/pedidos": "Pedidos",
  "/dashboard/opis": "OPIs",
  "/dashboard/cotizaciones": "Cotizaciones",
  "/dashboard/autorizaciones": "Autorización Financiera",
  "/dashboard/ordenes": "Órdenes de Compra",
  "/dashboard/facturas": "Facturas",
  "/dashboard/pagos": "Pagos",
  "/dashboard/recepciones": "Recepciones",
  "/dashboard/reclamos": "Reclamos",
  "/dashboard/stock": "Stock",
  "/dashboard/proveedores": "Proveedores",
  "/dashboard/usuarios": "Usuarios",
};

interface HeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export function Header({ onMenuToggle, showMenuButton }: HeaderProps) {
  const pathname = usePathname();

  const baseRoute = "/" + pathname.split("/").slice(1, 3).join("/");
  const title = PAGE_TITLES[baseRoute] ?? "ComprasPro";

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0">
      {showMenuButton && (
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
        >
          <NavIcon name="Menu" className="w-5 h-5" />
        </button>
      )}

      <h1 className="text-sm font-semibold text-gray-900 flex-1">{title}</h1>

      <div className="flex items-center gap-2">
        <NotificationBell />
      </div>
    </header>
  );
}
