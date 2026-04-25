import { prisma } from "@/lib/prisma";
import type { RolEnum } from "@/types";

export async function getDashboardStats(rol: RolEnum, empresaId?: string | null) {
  const empresaFilter = empresaId ? { empresaId } : {};

  const [
    pedidosPendientes,
    opisPendienteCot,
    opisPendienteAutfin,
    ocEmitidas,
    facturasVencer,
    reclamosAbiertos,
    totalPedidosHoy,
    totalOCMes,
  ] = await Promise.all([
    // Pedidos esperando autorización técnica
    prisma.pedido.count({
      where: { estado: "pendiente_autec", ...empresaFilter },
    }),
    // OPIs esperando cotizaciones
    prisma.oPI.count({
      where: { estado: "pendiente_cotizacion", ...empresaFilter },
    }),
    // OPIs esperando autorización financiera
    prisma.oPI.count({
      where: { estado: "pendiente_autfin", ...empresaFilter },
    }),
    // OCs emitidas (en tránsito)
    prisma.ordenCompra.count({
      where: { estado: "emitida" },
    }),
    // Facturas que vencen en los próximos 3 días
    prisma.factura.count({
      where: {
        estado: "pendiente",
        fechaVto: {
          lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
    }),
    // Reclamos abiertos o sin respuesta
    prisma.reclamo.count({
      where: { estado: { in: ["abierto", "enviado", "en_negociacion"] } },
    }),
    // Pedidos creados hoy
    prisma.pedido.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        ...empresaFilter,
      },
    }),
    // Total OCs del mes
    prisma.ordenCompra.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  return {
    pedidosPendientes,
    opisPendienteCot,
    opisPendienteAutfin,
    ocEmitidas,
    facturasVencer,
    reclamosAbiertos,
    totalPedidosHoy,
    totalOCMes,
  };
}

export async function getRecentActivity(rol: RolEnum, empresaId?: string | null) {
  const empresaFilter = empresaId ? { empresaId } : {};

  const [pedidos, opis, reclamos] = await Promise.all([
    prisma.pedido.findMany({
      where: empresaFilter,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { empresa: true, creador: { select: { nombre: true, apellido: true } } },
    }),
    prisma.oPI.findMany({
      where: empresaFilter,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { empresa: true, creador: { select: { nombre: true, apellido: true } } },
    }),
    prisma.reclamo.findMany({
      where: { estado: { in: ["abierto", "enviado"] } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { proveedor: true },
    }),
  ]);

  return { pedidos, opis, reclamos };
}

export async function getPipelineCounts() {
  const stages = [
    { key: "pendiente_autec", label: "Aut. Técnica", model: "pedido" as const },
    { key: "pendiente_cotizacion", label: "Cotización", model: "oPI" as const },
    { key: "pendiente_autfin", label: "Aut. Financiera", model: "oPI" as const },
    { key: "oc_generada", label: "OC Emitida", model: "oPI" as const },
  ];

  const counts = await Promise.all(
    stages.map(async (stage) => {
      const count =
        stage.model === "pedido"
          ? await prisma.pedido.count({ where: { estado: stage.key } })
          : await prisma.oPI.count({ where: { estado: stage.key } });
      return { ...stage, count };
    })
  );

  return counts;
}
