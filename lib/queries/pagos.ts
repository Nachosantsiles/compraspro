import { prisma } from "@/lib/prisma";

export async function getPagos() {
  return prisma.pago.findMany({
    include: {
      creador: { select: { nombre: true, apellido: true } },
      facturas: {
        include: {
          factura: {
            select: {
              id: true,
              numero: true,
              tipo: true,
              total: true,
              moneda: true,
              proveedor: { select: { nombre: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFacturasPendientesPago(empresaId?: string) {
  return prisma.factura.findMany({
    where: {
      estado: { in: ["pendiente", "vencida", "pagada_parcial"] },
      ...(empresaId ? { oc: { opi: { empresaId } } } : {}),
    },
    include: {
      proveedor: { select: { id: true, nombre: true } },
      oc: {
        select: {
          numero: true,
          opi: { select: { empresa: { select: { nombre: true } } } },
        },
      },
      pagos: { select: { monto: true } },
    },
    orderBy: { fechaVto: "asc" },
  });
}
