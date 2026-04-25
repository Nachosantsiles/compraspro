import { prisma } from "@/lib/prisma";

export async function getRecepciones(empresaId?: string) {
  return prisma.recepcion.findMany({
    where: empresaId ? { oc: { opi: { empresaId } } } : undefined,
    include: {
      oc: {
        select: {
          id: true,
          numero: true,
          moneda: true,
          total: true,
          opi: {
            select: {
              id: true,
              numero: true,
              empresaId: true,
              empresa: { select: { nombre: true } },
            },
          },
          proveedor: { select: { nombre: true } },
        },
      },
      creador: { select: { nombre: true, apellido: true } },
      _count: { select: { items: true, reclamos: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecepcionById(id: string) {
  return prisma.recepcion.findUnique({
    where: { id },
    include: {
      oc: {
        include: {
          proveedor: true,
          opi: {
            select: {
              id: true,
              numero: true,
              empresaId: true,
              empresa: { select: { nombre: true } },
            },
          },
          items: { orderBy: { orden: "asc" } },
        },
      },
      creador: { select: { nombre: true, apellido: true } },
      items: {
        include: {
          itemOC: true,
        },
        orderBy: { id: "asc" },
      },
      reclamos: {
        select: {
          id: true,
          numero: true,
          estado: true,
          motivo: true,
          resolucion: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function getOrdenesParaRecepcion(empresaId?: string) {
  return prisma.ordenCompra.findMany({
    where: {
      estado: { in: ["emitida", "recibida_parcial"] },
      ...(empresaId ? { opi: { empresaId } } : {}),
    },
    include: {
      proveedor: { select: { nombre: true } },
      opi: {
        select: {
          numero: true,
          empresa: { select: { nombre: true } },
        },
      },
      items: { orderBy: { orden: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}
