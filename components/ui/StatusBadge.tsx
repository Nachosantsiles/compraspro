import { cn } from "@/lib/utils";
import { ESTADO_COLORS, ESTADO_LABELS, URGENCIA_COLORS } from "@/lib/utils";

interface StatusBadgeProps {
  estado: string;
  className?: string;
}

export function StatusBadge({ estado, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        ESTADO_COLORS[estado] ?? "bg-gray-100 text-gray-600",
        className
      )}
    >
      {ESTADO_LABELS[estado] ?? estado}
    </span>
  );
}

export function UrgenciaBadge({ urgencia, className }: { urgencia: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        URGENCIA_COLORS[urgencia] ?? "bg-gray-100 text-gray-600",
        className
      )}
    >
      {urgencia}
    </span>
  );
}
