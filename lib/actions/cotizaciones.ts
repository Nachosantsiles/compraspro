"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { nextCotizNumero } from "@/lib/numbers";

interface ItemCotizInput {
  itemOPIId: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
  observaciones?: string;
}

interface CrearCotizacionInput {
  opiId: string;
  proveedorId: string;
  condiciones?: string;
  validezDias?: number;
  moneda?: string;
  tipoCambio?: number;
  observaciones?: string;
  items: ItemCotizInput[];
}

export async function crearCotizacion(input: CrearCotizacionInput) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "comprador"].includes(user.rol)) return { error: "Sin permisos" };

  if (!input.items.length) return { error: "Debe completar los precios de al menos un ítem" };
  if (input.items.some((i) => i.precioUnitario <= 0)) return { error: "Todos los precios deben ser mayores a 0" };

  try {
    const opi = await prisma.oPI.findUnique({ where: { id: input.opiId } });
    if (!opi) return { error: "OPI no encontrada" };
    if (!["pendiente_cotizacion", "cotizacion_completa"].includes(opi.estado)) {
      return { error: "La OPI no está en estado de cotización" };
    }

    // Verificar que no haya ya una cotización del mismo proveedor para esta OPI
    const existing = await prisma.cotizacion.findFirst({
      where: { opiId: input.opiId, proveedorId: input.proveedorId },
    });
    if (existing) return { error: "Ya existe una cotización de este proveedor para esta OPI" };

    const total = input.items.reduce((sum, i) => sum + i.subtotal, 0);
    const numero = await nextCotizNumero();

    const cotizacion = await prisma.cotizacion.create({
      data: {
        numero,
        opiId: input.opiId,
        proveedorId: input.proveedorId,
        creadorId: user.id,
        estado: "recibida",
        condiciones: input.condiciones ?? null,
        validezDias: input.validezDias ?? null,
        moneda: input.moneda ?? "ARS",
        tipoCambio: input.tipoCambio ?? null,
        total,
        observaciones: input.observaciones ?? null,
        items: {
          create: input.items.map((item) => ({
            itemOPIId: item.itemOPIId,
            precioUnitario: item.precioUnitario,
            cantidad: item.cantidad,
            subtotal: item.subtotal,
            observaciones: item.observaciones ?? null,
          })),
        },
      },
    });

    // Con al menos 1 cotización la OPI queda lista para comparar
    if (opi.estado === "pendiente_cotizacion") {
      await prisma.oPI.update({
        where: { id: input.opiId },
        data: { estado: "cotizacion_completa" },
      });
    }

    revalidatePath(`/dashboard/opis/${input.opiId}`);
    revalidatePath("/dashboard/cotizaciones");
    revalidatePath("/dashboard");
    return { success: true, id: cotizacion.id, numero: cotizacion.numero };
  } catch (e) {
    console.error(e);
    return { error: "Error al registrar la cotización" };
  }
}

export async function seleccionarGanadora(cotizacionId: string, opiId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "comprador"].includes(user.rol)) return { error: "Sin permisos" };

  try {
    const opi = await prisma.oPI.findUnique({ where: { id: opiId } });
    if (!opi) return { error: "OPI no encontrada" };

    const totalCots = await prisma.cotizacion.count({ where: { opiId } });
    if (totalCots < 1) return { error: "Debe haber al menos una cotización para seleccionar ganadora" };

    await prisma.$transaction(async (tx) => {
      // Desmarcar todas
      await tx.cotizacion.updateMany({ where: { opiId }, data: { seleccionada: false } });
      // Marcar ganadora
      await tx.cotizacion.update({ where: { id: cotizacionId }, data: { seleccionada: true, estado: "seleccionada" } });
      // Avanzar OPI
      await tx.oPI.update({ where: { id: opiId }, data: { estado: "pendiente_autfin" } });
      // Crear AutorizacionFin si no existe
      const existingAutFin = await tx.autorizacionFin.findUnique({ where: { opiId } });
      if (!existingAutFin) {
        await tx.autorizacionFin.create({ data: { opiId, estado: "pendiente" } });
      } else {
        await tx.autorizacionFin.update({ where: { opiId }, data: { estado: "pendiente" } });
      }
    });

    revalidatePath(`/dashboard/opis/${opiId}`);
    revalidatePath("/dashboard/autorizaciones");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Error al seleccionar la cotización ganadora" };
  }
}

export async function marcarCompraDirecta(opiId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "comprador"].includes(user.rol)) return { error: "Sin permisos" };

  try {
    const opi = await prisma.oPI.findUnique({ where: { id: opiId } });
    if (!opi) return { error: "OPI no encontrada" };
    if (!["pendiente_cotizacion", "cotizacion_completa"].includes(opi.estado)) {
      return { error: "La OPI no está en estado de cotización" };
    }

    await prisma.$transaction(async (tx) => {
      // Marcar como compra directa y avanzar a autfin
      await tx.oPI.update({
        where: { id: opiId },
        data: { compraDirecta: true, estado: "pendiente_autfin" },
      });
      // Crear AutorizacionFin si no existe
      const existingAutFin = await tx.autorizacionFin.findUnique({ where: { opiId } });
      if (!existingAutFin) {
        await tx.autorizacionFin.create({ data: { opiId, estado: "pendiente" } });
      } else {
        await tx.autorizacionFin.update({ where: { opiId }, data: { estado: "pendiente" } });
      }
    });

    revalidatePath(`/dashboard/opis/${opiId}`);
    revalidatePath("/dashboard/autorizaciones");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Error al marcar como compra directa" };
  }
}
