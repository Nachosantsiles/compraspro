"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { nextPedidoNumero, nextOPINumero } from "@/lib/numbers";

interface ItemInput {
  cantidad: number;
  unidadMedida: string;
  presentacion: string;
  detalle: string;
  unidadMedidaDetalle: string;
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
            detalle: item.detalle ?? "",
            unidadMedidaDetalle: item.unidadMedidaDetalle ?? "",
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
    // Traer pedido con todos los datos necesarios para generar la OPI
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { items: { orderBy: { orden: "asc" } } },
    });
    if (!pedido) return { error: "Pedido no encontrado" };

    const opiNumero = await nextOPINumero();

    await prisma.$transaction(async (tx) => {
      // 1. Aprobar AutTec
      await tx.autorizacionTec.update({
        where: { pedidoId },
        data: { estado: "aprobada", aprobadorId: user.id, comentario: comentario ?? null, fecha: new Date() },
      });

      // 2. Crear OPI automáticamente con todos los ítems del pedido
      await tx.oPI.create({
        data: {
          numero: opiNumero,
          pedidoId,
          empresaId: pedido.empresaId,
          fincaId: pedido.fincaId ?? null,
          ccId: pedido.ccId ?? null,
          ccFincaId: pedido.ccFincaId ?? null,
          solicitante: pedido.solicitante,
          descripcion: pedido.descripcion,
          urgencia: pedido.urgencia,
          estado: "pendiente_cotizacion",
          creadorId: user.id,
          items: {
            create: pedido.items.map((item, i) => ({
              cantidad: item.cantidad,
              unidadMedida: item.unidadMedida,
              presentacion: item.presentacion,
              categoriaId: item.categoriaId,
              subCategoriaId: item.subCategoriaId,
              itemPedidoId: item.id,
              orden: i,
            })),
          },
        },
      });

      // 3. Avanzar pedido directo a pendiente_cotizacion
      await tx.pedido.update({
        where: { id: pedidoId },
        data: { estado: "pendiente_cotizacion" },
      });
    });

    revalidatePath(`/dashboard/pedidos/${pedidoId}`);
    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard/opis");
    revalidatePath("/dashboard");
    return { success: true, opiNumero };
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

    // Traer los ítems del pedido para generar la OPI
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { items: { orderBy: { orden: "asc" } } },
    });
    if (!pedido) return { error: "Pedido no encontrado" };

    const opiNumero = await nextOPINumero();

    // Mapa de decisiones para acceso rápido
    const decisionMap = new Map(decisions.map((d) => [d.itemPedidoId, d]));

    // Ítems aprobados (ok o modificado con nueva cantidad)
    const itemsAprobados = pedido.items.filter((item) => {
      const dec = decisionMap.get(item.id);
      return !dec || dec.estado !== "denegado";
    });

    await prisma.$transaction(async (tx) => {
      // 1. Actualizar AutorizacionTec
      await tx.autorizacionTec.update({
        where: { pedidoId },
        data: { estado: "aprobada_parcial", aprobadorId: user.id, comentario: comentario ?? null, fecha: new Date() },
      });

      // 2. Guardar decisiones por ítem
      for (const d of decisions) {
        await tx.itemAutTec.upsert({
          where: { autTecId_itemPedidoId: { autTecId: autTec.id, itemPedidoId: d.itemPedidoId } },
          update: { estado: d.estado, nuevaCantidad: d.nuevaCantidad ?? null },
          create: { autTecId: autTec.id, itemPedidoId: d.itemPedidoId, estado: d.estado, nuevaCantidad: d.nuevaCantidad ?? null },
        });
      }

      // 3. Crear OPI automáticamente solo con ítems aprobados/modificados
      await tx.oPI.create({
        data: {
          numero: opiNumero,
          pedidoId,
          empresaId: pedido.empresaId,
          fincaId: pedido.fincaId ?? null,
          ccId: pedido.ccId ?? null,
          ccFincaId: pedido.ccFincaId ?? null,
          solicitante: pedido.solicitante,
          descripcion: pedido.descripcion,
          urgencia: pedido.urgencia,
          estado: "pendiente_cotizacion",
          creadorId: user.id,
          items: {
            create: itemsAprobados.map((item, i) => {
              const dec = decisionMap.get(item.id);
              return {
                cantidad: dec?.estado === "modificado" ? (dec.nuevaCantidad ?? item.cantidad) : item.cantidad,
                unidadMedida: item.unidadMedida,
                presentacion: item.presentacion,
                categoriaId: item.categoriaId,
                subCategoriaId: item.subCategoriaId,
                itemPedidoId: item.id,
                orden: i,
              };
            }),
          },
        },
      });

      // 4. Avanzar pedido directo a pendiente_cotizacion
      await tx.pedido.update({
        where: { id: pedidoId },
        data: { estado: "pendiente_cotizacion" },
      });
    });

    revalidatePath(`/dashboard/pedidos/${pedidoId}`);
    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard/opis");
    revalidatePath("/dashboard");
    return { success: true, opiNumero };
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

export async function asignarResponsable(pedidoId: string, responsableId: string | null) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (user.rol !== "admin") return { error: "Solo el administrador puede asignar responsables" };

  try {
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { responsableId: responsableId ?? null },
    });

    revalidatePath(`/dashboard/pedidos/${pedidoId}`);
    revalidatePath("/dashboard/pedidos");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Error al asignar responsable" };
  }
}
