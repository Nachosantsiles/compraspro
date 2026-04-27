import { prisma } from "@/lib/prisma";

export type CategoriaConSubs = Awaited<ReturnType<typeof getCategoriasByEmpresaTipo>>[number];

/**
 * Devuelve categorías filtradas por tipo de empresa.
 * "industrial"   → tipo "fabrica" + "todas"
 * "agropecuario" → tipo "finca"   + "todas"
 */
export async function getCategoriasByEmpresaTipo(empresaTipo: string) {
  const tipos =
    empresaTipo === "agropecuario" ? ["finca", "todas"] : ["fabrica", "todas"];

  return prisma.categoria.findMany({
    where: { tipo: { in: tipos }, activo: true },
    include: {
      subcategorias: {
        where: { activo: true },
        orderBy: { nombre: "asc" },
        include: {
          presentaciones: {
            where: { activo: true },
            orderBy: { nombre: "asc" },
          },
        },
      },
    },
    orderBy: { nombre: "asc" },
  });
}

/** Todas las categorías (para admin / OPI donde empresa puede ser cualquiera) */
export async function getAllCategorias() {
  return prisma.categoria.findMany({
    where: { activo: true },
    include: {
      subcategorias: {
        where: { activo: true },
        orderBy: { nombre: "asc" },
        include: {
          presentaciones: {
            where: { activo: true },
            orderBy: { nombre: "asc" },
          },
        },
      },
    },
    orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
  });
}
