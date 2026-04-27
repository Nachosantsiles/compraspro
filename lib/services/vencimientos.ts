import { prisma } from "@/lib/prisma";
import { sendMail, templatePedidoVencido } from "@/lib/email";

const DIAS_LIMITE = 3;

/**
 * Busca pedidos en "pendiente_autec" con más de DIAS_LIMITE días sin ser autorizados,
 * los marca como "vencido_autec", crea notificaciones in-app y envía emails.
 *
 * Seguro para llamar múltiples veces (idempotente por el cambio de estado).
 */
export async function verificarPedidosVencidos() {
  const limite = new Date();
  limite.setDate(limite.getDate() - DIAS_LIMITE);

  const pedidosVencidos = await prisma.pedido.findMany({
    where: {
      estado: "pendiente_autec",
      createdAt: { lte: limite },
    },
    include: {
      creador: { select: { id: true, nombre: true, apellido: true, email: true } },
    },
  });

  if (!pedidosVencidos.length) return { vencidos: 0 };

  for (const pedido of pedidosVencidos) {
    // 1. Cambiar estado
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { estado: "vencido_autec" },
    });

    // 2. Notificación in-app al creador
    await prisma.notificacion.create({
      data: {
        usuarioId: pedido.creadorId,
        tipo: "pedido_vencido",
        titulo: "Pedido vencido por falta de autorización",
        mensaje: `El pedido ${pedido.numero} — "${pedido.descripcion.slice(0, 80)}" fue dado de baja automáticamente por no haber recibido autorización técnica en los ${DIAS_LIMITE} días.`,
        pedidoId: pedido.id,
      },
    });

    // 3. Email (si está configurado el SMTP, sino sólo log)
    if (pedido.creador.email) {
      await sendMail({
        to: pedido.creador.email,
        subject: `Pedido ${pedido.numero} vencido por falta de autorización técnica`,
        html: templatePedidoVencido({
          nombre: pedido.creador.nombre,
          numeroPedido: pedido.numero,
          descripcion: pedido.descripcion,
        }),
      }).catch((err) =>
        console.error(`[vencimientos] Error enviando email a ${pedido.creador.email}:`, err)
      );
    }
  }

  return { vencidos: pedidosVencidos.length };
}
