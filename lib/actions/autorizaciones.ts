"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { nextOCNumero } from "@/lib/numbers";

export async function aprobarAutFin(opiId: string, comentario?: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "finanzas"].includes(user.rol)) return { error: "Sin permisos" };

  try {
    const opi = await prisma.oPI.findUnique({
      where: { id: opiId },
      include: {
        cotizaciones: {
          where: { seleccionada: true },
          include: {
            items: { include: { itemOPI: true } },
          },
        },
      },
    });

    if (!opi) return { error: "OPI no encontrada" };
    if (opi.estado !== "pendiente_autfin") return { error: "La OPI no está pendiente de autorización financiera" };

    const cotizGanadora = opi.cotizaciones[0];
    if (!cotizGanadora) return { error: "No hay cotización seleccionada" };

    const ocNumero = await nextOCNumero();

    await prisma.$transaction(async (tx) => {
      // 1. Aprobar AutorizacionFin
      await tx.autorizacionFin.update({
        where: { opiId },
        data: {
          estado: "aprobada",
          aprobadorId: user.id,
          comentario: comentario ?? null,
          fecha: new Date(),
        },
      });

      // 2. Crear OC automáticamente desde la cotización ganadora
      await tx.ordenCompra.create({
        data: {
          numero: ocNumero,
          opiId,
          proveedorId: cotizGanadora.proveedorId,
          estado: "emitida",
          moneda: cotizGanadora.moneda,
          total: cotizGanadora.total,
          condiciones: cotizGanadora.condiciones,
          observaciones: `OC generada automáticamente al aprobar OPI ${opi.numero}`,
          emitidaAt: new Date(),
          items: {
            create: cotizGanadora.items.map((ci, i) => ({
              descripcion: ci.itemOPI.descripcion,
              cantidad: ci.cantidad,
              unidadMedida: ci.itemOPI.unidadMedida,
              precioUnitario: ci.precioUnitario,
              subtotal: ci.subtotal,
              orden: i,
            })),
          },
        },
      });

      // 3. Actualizar OPI
      await tx.oPI.update({
        where: { id: opiId },
        data: { estado: "oc_generada" },
      });
    });

    revalidatePath(`/dashboard/opis/${opiId}`);
    revalidatePath("/dashboard/autorizaciones");
    revalidatePath("/dashboard/ordenes");
    revalidatePath("/dashboard");
    return { success: true, ocNumero };
  } catch (e) {
    console.error(e);
    return { error: "Error al aprobar la autorización financiera" };
  }
}

export async function rechazarAutFin(opiId: string, comentario: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "finanzas"].includes(user.rol)) return { error: "Sin permisos" };

  if (!comentario.trim()) return { error: "El motivo es obligatorio al rechazar" };

  try {
    await prisma.$transaction([
      prisma.autorizacionFin.update({
        where: { opiId },
        data: {
          estado: "rechazada",
          aprobadorId: user.id,
          comentario,
          fecha: new Date(),
        },
      }),
      prisma.oPI.update({
        where: { id: opiId },
        data: { estado: "rechazada_autfin" },
      }),
    ]);

    revalidatePath(`/dashboard/opis/${opiId}`);
    revalidatePath("/dashboard/autorizaciones");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Error al rechazar" };
  }
}
