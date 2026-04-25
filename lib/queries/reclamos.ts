import { prisma } from "@/lib/prisma";

export async function getReclamos(empresaId?: string) {
  return prisma.reclamo.findMany({
    where: empresaId ? { recepcion: { oc: { opi: { empresaId } } } } : undefined,
    include: {
      proveedor: { select: { nombre: true } },
      creador: { select: { nombre: true, apellido: true } },
      recepcion: {
        select: {
          id: true,
          numero: true,
          oc: {
            select: {
              id: true,
              numero: true,
              opi: {
                select: {
                  empresaId: true,
                  empresa: { select: { nombre: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReclamoById(id: string) {
  return prisma.reclamo.findUnique({
    where: { id },
    include: {
      proveedor: true,
      creador: { select: { nombre: true, apellido: true } },
      recepcion: {
        include: {
          oc: {
            select: {
              id: true,
              numero: true,
              opi: {
                select: {
                  id: true,
                  numero: true,
                  empresa: { select: { nombre: true } },
                },
              },
            },
          },
        },
      },
    },
  });
}
