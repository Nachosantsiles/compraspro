import { prisma } from "@/lib/prisma";

export async function getProveedores() {
  return prisma.proveedor.findMany({
    include: {
      _count: { select: { cotizaciones: true, ordenesCompra: true, facturas: true } },
    },
    orderBy: { nombre: "asc" },
  });
}

export async function getProveedorById(id: string) {
  return prisma.proveedor.findUnique({
    where: { id },
    include: {
      _count: { select: { cotizaciones: true, ordenesCompra: true, facturas: true } },
    },
  });
}
