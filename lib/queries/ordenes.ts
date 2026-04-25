import { prisma } from "@/lib/prisma";

export async function getOrdenes(empresaId?: string) {
  return prisma.ordenCompra.findMany({
    where: empresaId
      ? { opi: { empresaId } }
      : undefined,
    include: {
      proveedor: { select: { id: true, nombre: true } },
      opi: {
        select: {
          id: true,
          numero: true,
          empresaId: true,
          empresa: { select: { nombre: true } },
        },
      },
      _count: { select: { facturas: true, recepciones: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrdenById(id: string) {
  return prisma.ordenCompra.findUnique({
    where: { id },
    include: {
      proveedor: true,
      opi: {
        select: {
          id: true,
          numero: true,
          empresaId: true,
          empresa: { select: { nombre: true } },
          descripcion: true,
          solicitante: true,
          urgencia: true,
        },
      },
      items: { orderBy: { orden: "asc" } },
      facturas: {
        orderBy: { createdAt: "desc" },
        select: { id: true, numero: true, tipo: true, total: true, moneda: true, estado: true, fechaEmision: true, fechaVto: true },
      },
      recepciones: {
        orderBy: { createdAt: "desc" },
        select: { id: true, numero: true, estado: true, fechaRecepcion: true, createdAt: true },
      },
    },
  });
}
