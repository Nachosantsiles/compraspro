import { prisma } from "@/lib/prisma";

/** Todas las presentaciones activas, con su subcategoría y categoría */
export async function getPresentacionesAgrupadas() {
  const categorias = await prisma.categoria.findMany({
    where: { activo: true },
    include: {
      subcategorias: {
        where: { activo: true },
        include: {
          presentaciones: {
            orderBy: { nombre: "asc" },
          },
        },
        orderBy: { nombre: "asc" },
      },
    },
    orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
  });

  return categorias;
}
