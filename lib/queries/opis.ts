import { prisma } from "@/lib/prisma";

export type OPIListItem = Awaited<ReturnType<typeof getOPIs>>[number];
export type OPIDetalle = NonNullable<Awaited<ReturnType<typeof getOPIById>>>;

export async function getOPIs(filters?: {
  estado?: string;
  empresaId?: string;
  urgencia?: string;
  search?: string;
}) {
  return prisma.oPI.findMany({
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
      creador: { select: { id: true, nombre: true, apellido: true } },
      autFinanciera: true,
      ordenCompra: { select: { id: true, numero: true, estado: true } },
      _count: { select: { items: true, cotizaciones: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOPIById(id: string) {
  return prisma.oPI.findUnique({
    where: { id },
    include: {
      empresa: true,
      finca: true,
      centroCosto: { include: { departamento: true } },
      centroCostoFinca: true,
      creador: { select: { id: true, nombre: true, apellido: true, rol: true } },
      items: { orderBy: { orden: "asc" } },
      cotizaciones: {
        include: {
          proveedor: true,
          creador: { select: { nombre: true, apellido: true } },
          items: { include: { itemOPI: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      autFinanciera: {
        include: {
          aprobador: { select: { id: true, nombre: true, apellido: true } },
        },
      },
      ordenCompra: true,
    },
  });
}

export async function getFormData() {
  const [empresas, fincas, ccFincas] = await Promise.all([
    prisma.empresa.findMany({
      include: {
        departamentos: {
          include: { centrosCosto: true },
          orderBy: { nombre: "asc" },
        },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.finca.findMany({ orderBy: { nombre: "asc" } }),
    prisma.centroCostoFinca.findMany({ orderBy: { categoria: "asc" } }),
  ]);
  return { empresas, fincas, ccFincas };
}
