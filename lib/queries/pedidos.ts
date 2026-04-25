import { prisma } from "@/lib/prisma";

export type PedidoListItem = Awaited<ReturnType<typeof getPedidos>>[number];
export type PedidoDetalle = NonNullable<Awaited<ReturnType<typeof getPedidoById>>>;

export async function getPedidos(filters?: {
  estado?: string;
  empresaId?: string;
  urgencia?: string;
  search?: string;
}) {
  return prisma.pedido.findMany({
    where: {
      ...(filters?.estado && { estado: filters.estado }),
      ...(filters?.empresaId && { empresaId: filters.empresaId }),
      ...(filters?.urgencia && { urgencia: filters.urgencia }),
      ...(filters?.search && {
        OR: [
          { numero: { contains: filters.search } },
          { descripcion: { contains: filters.search } },
          { solicitante: { contains: filters.search } },
        ],
      }),
    },
    include: {
      empresa: true,
      creador: { select: { id: true, nombre: true, apellido: true, rol: true } },
      autTecnica: true,
      opi: { select: { id: true, numero: true, estado: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPedidoById(id: string) {
  return prisma.pedido.findUnique({
    where: { id },
    include: {
      empresa: true,
      finca: true,
      centroCosto: { include: { departamento: true } },
      centroCostoFinca: true,
      creador: { select: { id: true, nombre: true, apellido: true, rol: true } },
      items: {
        include: {
          categoria: true,
          subCategoria: true,
        },
        orderBy: { orden: "asc" },
      },
      autTecnica: {
        include: {
          aprobador: { select: { id: true, nombre: true, apellido: true } },
        },
      },
      opi: { select: { id: true, numero: true, estado: true } },
    },
  });
}

export async function getPedidosAprobadosSinOPI(empresaId?: string | null) {
  return prisma.pedido.findMany({
    where: {
      estado: "aprobado_autec",
      opi: null,
      ...(empresaId && { empresaId }),
    },
    include: {
      empresa: true,
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
