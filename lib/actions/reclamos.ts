"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function resolverReclamo(
  reclamoId: string,
  resolucion: string,
  descripcion?: string,
  notaCredito?: number
) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "almacen", "comprador"].includes(user.rol)) return { error: "Sin permiso" };

  const reclamo = await prisma.reclamo.findUnique({ where: { id: reclamoId } });
  if (!reclamo) return { error: "Reclamo no encontrado" };
  if (reclamo.estado === "resuelto") return { error: "El reclamo ya fue resuelto" };

  await prisma.reclamo.update({
    where: { id: reclamoId },
    data: {
      estado: "resuelto",
      resolucion,
      descripcion: descripcion || null,
      notaCredito: notaCredito || null,
      fechaRespuesta: new Date(),
    },
  });

  revalidatePath(`/dashboard/reclamos/${reclamoId}`);
  revalidatePath("/dashboard/reclamos");

  return { ok: true };
}

export async function enviarReclamo(reclamoId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "almacen", "comprador"].includes(user.rol)) return { error: "Sin permiso" };

  await prisma.reclamo.update({
    where: { id: reclamoId },
    data: { estado: "enviado", fechaEnvio: new Date() },
  });

  revalidatePath(`/dashboard/reclamos/${reclamoId}`);
  revalidatePath("/dashboard/reclamos");

  return { ok: true };
}
