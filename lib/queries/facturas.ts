import { prisma } from "@/lib/prisma";

export async function getFacturas(empresaId?: string) {
  return prisma.factura.findMany({
    where: empresaId ? { oc: { opi: { empresaId } } } : undefined,
    include: {
      proveedor: { select: { id: true, nombre: true } },
      oc: {
        select: {
          id: true,
          numero: true,
          opi: { select: { id: true, numero: true, empresaId: true, empresa: { select: { nombre: true } } } },
        },
      },
      _count: { select: { pagos: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrdenesEmitidas(empresaId?: string) {
  return prisma.ordenCompra.findMany({
    where: {
      estado: { in: ["emitida", "recibida_parcial", "recibida"] },
      ...(empresaId ? { opi: { empresaId } } : {}),
    },
    include: {
      proveedor: { select: { id: true, nombre: true } },
      opi: { select: { id: true, numero: true, empresa: { select: { nombre: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}
