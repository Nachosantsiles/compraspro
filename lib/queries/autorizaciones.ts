import { prisma } from "@/lib/prisma";

export async function getOPIsPendienteAutFin(empresaId?: string | null) {
  return prisma.oPI.findMany({
    where: {
      estado: "pendiente_autfin",
      ...(empresaId && { empresaId }),
    },
    include: {
      empresa: true,
      creador: { select: { nombre: true, apellido: true } },
      cotizaciones: {
        where: { seleccionada: true },
        include: { proveedor: true },
      },
      autFinanciera: {
        include: { aprobador: { select: { nombre: true, apellido: true } } },
      },
      _count: { select: { cotizaciones: true } },
    },
    orderBy: [{ urgencia: "desc" }, { createdAt: "asc" }],
  });
}
