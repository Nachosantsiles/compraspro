import { prisma } from "@/lib/prisma";

export async function getUsuarios() {
  return prisma.usuario.findMany({
    include: {
      empresa: { select: { id: true, nombre: true, color: true } },
      _count: { select: { pedidosCreados: true, opisCreadas: true } },
    },
    orderBy: [{ empresaId: "asc" }, { nombre: "asc" }],
  });
}

export async function getEmpresas() {
  return prisma.empresa.findMany({ orderBy: { nombre: "asc" } });
}
