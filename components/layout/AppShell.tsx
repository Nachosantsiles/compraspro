"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import type { RolEnum } from "@/types";
import { NavIcon } from "./NavIcon";

interface AppShellProps {
  children: React.ReactNode;
  rol: RolEnum;
  userName: string;
  empresaNombre?: string;
  empresaColor?: string;
}

export function AppShell({ children, rol, userName, empresaNombre, empresaColor }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop always visible, mobile via overlay */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex-shrink-0 transition-transform duration-200 lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <Sidebar
          rol={rol}
          userName={userName}
          empresaNombre={empresaNombre}
          empresaColor={empresaColor}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuToggle={() => setMobileOpen((v) => !v)}
          showMenuButton={true}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
