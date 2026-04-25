"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { nextOPINumero } from "@/lib/numbers";

interface ItemOPIInput {
  cantidad: number;
  unidadMedida: string;
  descripcion: string;
  marca?: string;
  itemPedidoId?: string;
}

interface CrearOPIInput {
  pedidoId?: string;
  empresaId: string;
  fincaId?: string;
  ccId?: string;
  ccFincaId?: string;
  solicitante: string;
  descripcion: string;
  observaciones?: string;
  urgencia: string;
  items: ItemOPIInput[];
}

export async function crearOPI(input: CrearOPIInput) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "comprador"].includes(user.rol)) return { error: "Sin permisos" };

  if (!input.items.length) return { error: "Debe agregar al menos un ítem" };

  try {
    const numero = await nextOPINumero();

    // Validate pedido exists and is approved if provided
    if (input.pedidoId) {
      const pedido = await prisma.pedido.findUnique({ where: { id: input.pedidoId } });
      if (!pedido) return { error: "Pedido no encontrado" };
      if (pedido.estado !== "aprobado_autec") return { error: "El pedido no tiene autorización técnica aprobada" };
      const existing = await prisma.oPI.findUnique({ where: { pedidoId: input.pedidoId } });
      if (existing) return { error: "Ya existe una OPI para este pedido" };
    }

    const opi = await prisma.oPI.create({
      data: {
        numero,
        pedidoId: input.pedidoId!,
        empresaId: input.empresaId,
        fincaId: input.fincaId ?? null,
        ccId: input.ccId ?? null,
        ccFincaId: input.ccFincaId ?? null,
        solicitante: input.solicitante,
        descripcion: input.descripcion,
        observaciones: input.observaciones ?? null,
        urgencia: input.urgencia,
        estado: "pendiente_cotizacion",
        creadorId: user.id,
        items: {
          create: input.items.map((item, i) => ({
            cantidad: item.cantidad,
            unidadMedida: item.unidadMedida,
            descripcion: item.descripcion,
            marca: item.marca ?? null,
            itemPedidoId: item.itemPedidoId ?? null,
            orden: i,
          })),
        },
      },
    });

    // Update pedido estado if linked
    if (input.pedidoId) {
      await prisma.pedido.update({
        where: { id: input.pedidoId },
        data: { estado: "pendiente_cotizacion" },
      });
    }

    revalidatePath("/dashboard/opis");
    revalidatePath("/dashboard");
    return { success: true, id: opi.id, numero: opi.numero };
  } catch (e) {
    console.error(e);
    return { error: "Error al crear la OPI" };
  }
}
