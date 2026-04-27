import type { RolEnum } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name
  roles: RolEnum[];
  badge?: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: "LayoutDashboard",
        roles: ["admin", "tecnico", "finanzas", "comprador", "almacen"],
      },
    ],
  },
  {
    label: "Compras",
    items: [
      {
        label: "Pedidos",
        href: "/dashboard/pedidos",
        icon: "ClipboardList",
        roles: ["admin", "tecnico"],
      },
      {
        label: "OPIs",
        href: "/dashboard/opis",
        icon: "FileText",
        roles: ["admin", "comprador", "tecnico"],
      },
      {
        label: "Cotizaciones",
        href: "/dashboard/cotizaciones",
        icon: "ReceiptText",
        roles: ["admin", "comprador"],
      },
      {
        label: "Aut. Financiera",
        href: "/dashboard/autorizaciones",
        icon: "BadgeCheck",
        roles: ["admin", "finanzas"],
      },
      {
        label: "Órdenes de Compra",
        href: "/dashboard/ordenes",
        icon: "ShoppingCart",
        roles: ["admin", "comprador", "finanzas"],
      },
    ],
  },
  {
    label: "Finanzas",
    items: [
      {
        label: "Facturas",
        href: "/dashboard/facturas",
        icon: "Receipt",
        roles: ["admin", "finanzas"],
      },
      {
        label: "Pagos",
        href: "/dashboard/pagos",
        icon: "CreditCard",
        roles: ["admin", "finanzas"],
      },
    ],
  },
  {
    label: "Almacén",
    items: [
      {
        label: "Recepciones",
        href: "/dashboard/recepciones",
        icon: "PackageCheck",
        roles: ["admin", "almacen"],
      },
      {
        label: "Reclamos",
        href: "/dashboard/reclamos",
        icon: "AlertTriangle",
        roles: ["admin", "almacen", "comprador"],
      },
      {
        label: "Stock",
        href: "/dashboard/stock",
        icon: "Package",
        roles: ["admin", "almacen"],
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        label: "Proveedores",
        href: "/dashboard/proveedores",
        icon: "Building2",
        roles: ["admin", "comprador"],
      },
      {
        label: "Usuarios",
        href: "/dashboard/usuarios",
        icon: "Users",
        roles: ["admin"],
      },
      {
        label: "Presentaciones",
        href: "/dashboard/presentaciones",
        icon: "Tag",
        roles: ["admin"],
      },
    ],
  },
];

export function getNavForRole(rol: RolEnum): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(rol)),
  })).filter((group) => group.items.length > 0);
}
