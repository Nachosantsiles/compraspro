"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function crearFactura(data: {
  ocId: string;
  numero: string;
  tipo: string;
  moneda: string;
  subtotal: number;
  iva: number;
  fechaEmision: string;
  fechaVto?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "finanzas"].includes(user.rol)) return { error: "Sin permiso" };

  const oc = await prisma.ordenCompra.findUnique({
    where: { id: data.ocId },
    include: { proveedor: true },
  });
  if (!oc) return { error: "OC no encontrada" };
  if (!["emitida", "recibida_parcial", "recibida"].includes(oc.estado)) {
    return { error: "La OC debe estar emitida para registrar facturas" };
  }

  const existe = await prisma.factura.findFirst({
    where: { numero: data.numero, proveedorId: oc.proveedorId },
  });
  if (existe) return { error: "Ya existe una factura con ese número para este proveedor" };

  const total = data.subtotal + data.iva;

  const factura = await prisma.factura.create({
    data: {
      numero: data.numero,
      tipo: data.tipo,
      ocId: data.ocId,
      proveedorId: oc.proveedorId,
      moneda: data.moneda,
      subtotal: data.subtotal,
      iva: data.iva,
      total,
      fechaEmision: new Date(data.fechaEmision),
      fechaVto: data.fechaVto ? new Date(data.fechaVto) : null,
      estado: "pendiente",
    },
  });

  revalidatePath(`/dashboard/ordenes/${data.ocId}`);
  revalidatePath("/dashboard/facturas");

  return { ok: true, facturaId: factura.id };
}
