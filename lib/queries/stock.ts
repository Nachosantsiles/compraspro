import { prisma } from "@/lib/prisma";

export async function getArticulos() {
  return prisma.articulo.findMany({
    include: {
      _count: { select: { movimientos: true } },
    },
    orderBy: { codigo: "asc" },
  });
}

export async function getMovimientos(articuloId: string) {
  return prisma.movimientoStock.findMany({
    where: { articuloId },
    orderBy: { fecha: "desc" },
    take: 50,
  });
}
