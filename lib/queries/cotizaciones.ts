import { prisma } from "@/lib/prisma";

export type CotizacionListItem = Awaited<ReturnType<typeof getCotizaciones>>[number];
export type CotizacionDetalle = NonNullable<Awaited<ReturnType<typeof getCotizacionById>>>;

export async function getCotizaciones(filters?: { opiId?: string; estado?: string }) {
  return prisma.cotizacion.findMany({
    where: {
      ...(filters?.opiId && { opiId: filters.opiId }),
      ...(filters?.estado && { estado: filters.estado }),
    },
    include: {
      opi: {
        select: { id: true, numero: true, descripcion: true, estado: true, empresaId: true, empresa: true },
      },
      proveedor: true,
      creador: { select: { nombre: true, apellido: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCotizacionById(id: string) {
  return prisma.cotizacion.findUnique({
    where: { id },
    include: {
      opi: {
        include: {
          items: { orderBy: { orden: "asc" } },
          empresa: true,
        },
      },
      proveedor: true,
      creador: { select: { nombre: true, apellido: true } },
      items: {
        include: { itemOPI: true },
        orderBy: { itemOPI: { orden: "asc" } },
      },
    },
  });
}

export async function getOPIsParaCotizar(empresaId?: string | null) {
  return prisma.oPI.findMany({
    where: {
      estado: { in: ["pendiente_cotizacion", "cotizacion_completa"] },
      ...(empresaId && { empresaId }),
    },
    include: {
      empresa: true,
      _count: { select: { cotizaciones: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCotizacionesPorOPI(opiId: string) {
  return prisma.cotizacion.findMany({
    where: { opiId },
    include: {
      proveedor: true,
      creador: { select: { nombre: true, apellido: true } },
      items: {
        include: { itemOPI: true },
        orderBy: { itemOPI: { orden: "asc" } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
