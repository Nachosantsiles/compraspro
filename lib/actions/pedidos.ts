"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { nextPedidoNumero } from "@/lib/numbers";

interface ItemInput {
  cantidad: number;
  unidadMedida: string;
  presentacion: string;
  categoriaId: string;
  subCategoriaId: string;
}

interface CrearPedidoInput {
  empresaId: string;
  fincaId?: string;
  ccId?: string;
  ccFincaId?: string;
  solicitante: string;
  descripcion: string;
  urgencia: string;
  items: ItemInput[];
}

export async function crearPedido(input: CrearPedidoInput) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "tecnico"].includes(user.rol)) return { error: "Sin permisos" };

  if (!input.items.length) return { error: "Debe agregar al menos un ítem" };

  try {
    const numero = await nextPedidoNumero();

    const pedido = await prisma.pedido.create({
      data: {
        numero,
        empresaId: input.empresaId,
        fincaId: input.fincaId ?? null,
        ccId: input.ccId ?? null,
        ccFincaId: input.ccFincaId ?? null,
        solicitante: input.solicitante,
        descripcion: input.descripcion,
        urgencia: input.urgencia,
        estado: "pendiente_autec",
        creadorId: user.id,
        items: {
          create: input.items.map((item, i) => ({
            cantidad: item.cantidad,
            unidadMedida: item.unidadMedida,
            presentacion: item.presentacion,
            categoriaId: item.categoriaId,
            subCategoriaId: item.subCategoriaId,
            orden: i,
          })),
        },
        autTecnica: {
          create: { estado: "pendiente" },
        },
      },
    });

    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard");
    return { success: true, id: pedido.id, numero: pedido.numero };
  } catch (e) {
    console.error(e);
    return { error: "Error al crear el pedido" };
  }
}

export async function aprobarAutTecnica(pedidoId: string, comentario?: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "tecnico"].includes(user.rol)) return { error: "Sin permisos" };

  try {
    await prisma.$transaction([
      prisma.autorizacionTec.update({
        where: { pedidoId },
        data: {
          estado: "aprobada",
          aprobadorId: user.id,
          comentario: comentario ?? null,
          fecha: new Date(),
        },
      }),
      prisma.pedido.update({
        where: { id: pedidoId },
        data: { estado: "aprobado_autec" },
      }),
    ]);

    revalidatePath(`/dashboard/pedidos/${pedidoId}`);
    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Error al aprobar" };
  }
}

interface ItemDecision {
  itemPedidoId: string;
  estado: "ok" | "denegado" | "modificado";
  nuevaCantidad?: number;
}

export async function aprobarParcialAutTecnica(
  pedidoId: string,
  decisions: ItemDecision[],
  comentario?: string
) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "tecnico"].includes(user.rol)) return { error: "Sin permisos" };

  if (!decisions.length) return { error: "Debe haber al menos un ítem" };

  // Al menos un ítem aprobado (ok o modificado)
  const aprobados = decisions.filter((d) => d.estado !== "denegado");
  if (!aprobados.length) return { error: "Debe aprobar al menos un ítem. Si ninguno aplica, usá 'No autorizar'" };

  // Items modificados deben tener nuevaCantidad válida
  const invalido = decisions.find(
    (d) => d.estado === "modificado" && (!d.nuevaCantidad || d.nuevaCantidad <= 0)
  );
  if (invalido) return { error: "Completá la nueva cantidad en los ítems modificados" };

  try {
    const autTec = await prisma.autorizacionTec.findUnique({ where: { pedidoId } });
    if (!autTec) return { error: "Autorización técnica no encontrada" };

    await prisma.$transaction(async (tx) => {
      // 1. Actualizar AutorizacionTec
      await tx.autorizacionTec.update({
        where: { pedidoId },
        data: {
          estado: "aprobada_parcial",
          aprobadorId: user.id,
          comentario: comentario ?? null,
          fecha: new Date(),
        },
      });

      // 2. Guardar decisiones por ítem
      for (const d of decisions) {
        await tx.itemAutTec.upsert({
          where: { autTecId_itemPedidoId: { autTecId: autTec.id, itemPedidoId: d.itemPedidoId } },
          update: { estado: d.estado, nuevaCantidad: d.nuevaCantidad ?? null },
          create: {
            autTecId: autTec.id,
            itemPedidoId: d.itemPedidoId,
            estado: d.estado,
            nuevaCantidad: d.nuevaCantidad ?? null,
          },
        });
      }

      // 3. Avanzar estado del pedido (igual que aprobación total — el comprador verá las restricciones en la OPI)
      await tx.pedido.update({
        where: { id: pedidoId },
        data: { estado: "aprobado_autec" },
      });
    });

    revalidatePath(`/dashboard/pedidos/${pedidoId}`);
    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Error al guardar la aprobación parcial" };
  }
}

export async function rechazarAutTecnica(pedidoId: string, comentario: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "tecnico"].includes(user.rol)) return { error: "Sin permisos" };

  if (!comentario.trim()) return { error: "El motivo es obligatorio al rechazar" };

  try {
    await prisma.$transaction([
      prisma.autorizacionTec.update({
        where: { pedidoId },
        data: {
          estado: "rechazada",
          aprobadorId: user.id,
          comentario,
          fecha: new Date(),
        },
      }),
      prisma.pedido.update({
        where: { id: pedidoId },
        data: { estado: "rechazado_autec" },
      }),
    ]);

    revalidatePath(`/dashboard/pedidos/${pedidoId}`);
    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Error al rechazar" };
  }
}
