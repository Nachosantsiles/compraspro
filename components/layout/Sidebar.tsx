"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getNavForRole } from "@/lib/nav";
import { NavIcon } from "./NavIcon";
import type { RolEnum } from "@/types";

interface SidebarProps {
  rol: RolEnum;
  userName: string;
  empresaNombre?: string;
  empresaColor?: string;
  collapsed?: boolean;
}

export function Sidebar({ rol, userName, empresaNombre, empresaColor, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const navGroups = getNavForRole(rol);

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-gray-900 text-gray-100 transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight">ComprasPro</p>
            <p className="text-[10px] text-gray-500 leading-tight">v6.0</p>
          </div>
        )}
      </div>

      {/* Empresa badge */}
      {!collapsed && empresaNombre && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg border border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: empresaColor ?? "#6b7280" }}
            />
            <span className="text-xs text-gray-300 truncate">{empresaNombre}</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {navGroups.map((group, gi) => (
          <div key={gi} className="mb-1">
            {!collapsed && group.label && (
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-colors duration-100",
                    active
                      ? "bg-white/10 text-white font-medium"
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <NavIcon name={item.icon} className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && active && (
                    <NavIcon name="ChevronRight" className="w-3 h-3 ml-auto opacity-50" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-gray-800 p-3">
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">{userName}</p>
              <p className="text-[10px] text-gray-500 capitalize">{rol}</p>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Cerrar sesión"
          >
            <NavIcon name="LogOut" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
