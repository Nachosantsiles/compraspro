import { prisma } from "@/lib/prisma";

export async function getUnidades() {
  return prisma.unidadMedida.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });
}
