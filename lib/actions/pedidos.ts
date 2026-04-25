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
