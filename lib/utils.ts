import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy") {
  return format(new Date(date), pattern, { locale: es });
}

export function formatCurrency(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function generateNumero(prefix: string, count: number) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count).padStart(4, "0")}`;
}

// Colores de empresa
export const EMPRESA_COLORS: Record<string, string> = {
  tomalar: "#185FA5",
  seville_cazorla: "#3B6D11",
  fincas_grupo_cazorla: "#854F0B",
};

// Labels de estados
export const ESTADO_LABELS: Record<string, string> = {
  // Pedido / OPI
  pendiente_autec: "Pendiente Aut. Técnica",
  aprobado_autec: "Aprobado Téc.",
  rechazado_autec: "Rechazado Téc.",
  pendiente_cotizacion: "Pendiente Cotización",
  cotizacion_completa: "Cotización Completa",
  pendiente_autfin: "Pendiente Aut. Financiera",
  aprobado_autfin: "Aprobado Fin.",
  aprobada_autfin: "Aprobado Fin.",
  rechazado_autfin: "Rechazado Fin.",
  rechazada_autfin: "Rechazado Fin.",
  oc_generada: "OC Generada",
  // OC
  borrador: "Borrador",
  emitida: "Emitida",
  recibida_parcial: "Recibida Parcial",
  recibida: "Recibida",
  cancelada: "Cancelada",
  // Factura
  pendiente: "Pendiente",
  pagada: "Pagada",
  vencida: "Vencida",
  pagada_parcial: "Pago Parcial",
  // Recepcion
  pendiente_control: "Pendiente Control",
  aprobada: "Aprobada",
  con_diferencias: "Con Diferencias",
  bloqueada: "Bloqueada",
  // Reclamo
  abierto: "Abierto",
  enviado: "Enviado",
  en_negociacion: "En Negociación",
  resuelto: "Resuelto",
  cerrado_sin_resolucion: "Cerrado S/R",
};

// Colores de estado (Tailwind classes)
export const ESTADO_COLORS: Record<string, string> = {
  pendiente_autec: "bg-yellow-100 text-yellow-800",
  aprobado_autec: "bg-blue-100 text-blue-800",
  rechazado_autec: "bg-red-100 text-red-800",
  pendiente_cotizacion: "bg-orange-100 text-orange-800",
  cotizacion_completa: "bg-indigo-100 text-indigo-800",
  pendiente_autfin: "bg-purple-100 text-purple-800",
  aprobado_autfin: "bg-green-100 text-green-800",
  aprobada_autfin: "bg-green-100 text-green-800",
  rechazado_autfin: "bg-red-100 text-red-800",
  rechazada_autfin: "bg-red-100 text-red-800",
  oc_generada: "bg-teal-100 text-teal-800",
  borrador: "bg-gray-100 text-gray-700",
  emitida: "bg-blue-100 text-blue-800",
  recibida_parcial: "bg-amber-100 text-amber-800",
  recibida: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
  pendiente: "bg-yellow-100 text-yellow-800",
  pagada: "bg-green-100 text-green-800",
  vencida: "bg-red-100 text-red-800",
  pagada_parcial: "bg-amber-100 text-amber-800",
  pendiente_control: "bg-yellow-100 text-yellow-800",
  aprobada: "bg-green-100 text-green-800",
  con_diferencias: "bg-orange-100 text-orange-800",
  bloqueada: "bg-red-100 text-red-800",
  abierto: "bg-yellow-100 text-yellow-800",
  enviado: "bg-blue-100 text-blue-800",
  en_negociacion: "bg-purple-100 text-purple-800",
  resuelto: "bg-green-100 text-green-800",
  cerrado_sin_resolucion: "bg-gray-100 text-gray-600",
};

export const URGENCIA_COLORS: Record<string, string> = {
  Baja: "bg-gray-100 text-gray-700",
  Media: "bg-amber-100 text-amber-800",
  Critica: "bg-red-100 text-red-800",
};

export const ROL_LABELS: Record<string, string> = {
  admin: "Administrador",
  tecnico: "Técnico",
  finanzas: "Finanzas",
  comprador: "Comprador",
  almacen: "Almacén",
};
