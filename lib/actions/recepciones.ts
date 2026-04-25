"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { nextRecepcionNumero, nextReclamoNumero } from "@/lib/numbers";

export async function crearRecepcion(data: {
  ocId: string;
  fechaRecepcion: string;
  observaciones?: string;
  items: { itemOCId: string; cantRecibida: number }[];
}) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "almacen"].includes(user.rol)) return { error: "Sin permiso" };

  const oc = await prisma.ordenCompra.findUnique({
    where: { id: data.ocId },
    include: { items: true },
  });
  if (!oc) return { error: "OC no encontrada" };
  if (!["emitida", "recibida_parcial"].includes(oc.estado)) {
    return { error: "La OC debe estar emitida para registrar una recepción" };
  }

  const numero = await nextRecepcionNumero();

  const recepcion = await prisma.$transaction(async (tx) => {
    // Construir items con diferencias
    const itemsData = data.items.map((i) => {
      const itemOC = oc.items.find((it) => it.id === i.itemOCId)!;
      const diferencia = i.cantRecibida - itemOC.cantidad;
      let estado = "ok";
      if (diferencia < 0) estado = "faltante";
      else if (diferencia > 0) estado = "exceso";
      return {
        itemOCId: i.itemOCId,
        cantPedida: itemOC.cantidad,
        cantRecibida: i.cantRecibida,
        diferencia,
        estado,
      };
    });

    const hayDiferencias = itemsData.some((i) => i.estado !== "ok");
    const estadoRecepcion = hayDiferencias ? "con_diferencias" : "aprobada";

    const rec = await tx.recepcion.create({
      data: {
        numero,
        ocId: data.ocId,
        creadorId: user.id,
        estado: estadoRecepcion,
        fechaRecepcion: new Date(data.fechaRecepcion),
        observaciones: data.observaciones || null,
        items: { create: itemsData },
      },
    });

    // Actualizar cantRecibida en items de la OC
    for (const i of data.items) {
      await tx.itemOC.update({
        where: { id: i.itemOCId },
        data: { cantRecibida: { increment: i.cantRecibida } },
      });
    }

    // Determinar nuevo estado de la OC
    const itemsActualizados = await tx.itemOC.findMany({ where: { ocId: data.ocId } });
    const todosRecibidos = itemsActualizados.every((i) => i.cantRecibida >= i.cantidad);
    const nuevoEstadoOC = todosRecibidos ? "recibida" : "recibida_parcial";

    await tx.ordenCompra.update({
      where: { id: data.ocId },
      data: { estado: nuevoEstadoOC },
    });

    // Auto-generar reclamos por diferencias
    if (hayDiferencias) {
      for (const item of itemsData.filter((i) => i.estado !== "ok")) {
        const itemOC = oc.items.find((it) => it.id === item.itemOCId)!;
        const reclamoNum = await nextReclamoNumero();
        await tx.reclamo.create({
          data: {
            numero: reclamoNum,
            recepcionId: rec.id,
            proveedorId: oc.proveedorId,
            creadorId: user.id,
            estado: "abierto",
            motivo: item.estado === "faltante"
              ? `Faltante: se recibieron ${item.cantRecibida} de ${item.cantPedida} (${itemOC.descripcion})`
              : `Exceso: se recibieron ${item.cantRecibida} vs ${item.cantPedida} pedidos (${itemOC.descripcion})`,
          },
        });
      }
    }

    return rec;
  });

  revalidatePath(`/dashboard/ordenes/${data.ocId}`);
  revalidatePath("/dashboard/recepciones");

  return { ok: true, recepcionId: recepcion.id, numero };
}
