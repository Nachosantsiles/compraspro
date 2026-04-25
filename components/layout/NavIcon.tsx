"use client";

import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  ReceiptText,
  BadgeCheck,
  ShoppingCart,
  Receipt,
  CreditCard,
  PackageCheck,
  AlertTriangle,
  Package,
  Building2,
  Users,
  ChevronRight,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ClipboardList,
  FileText,
  ReceiptText,
  BadgeCheck,
  ShoppingCart,
  Receipt,
  CreditCard,
  PackageCheck,
  AlertTriangle,
  Package,
  Building2,
  Users,
  ChevronRight,
  Bell,
  LogOut,
  Menu,
  X,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}
