"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function emitirOrden(ocId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "comprador"].includes(user.rol)) return { error: "Sin permiso" };

  const oc = await prisma.ordenCompra.findUnique({ where: { id: ocId } });
  if (!oc) return { error: "OC no encontrada" };
  if (oc.estado !== "borrador") return { error: "Solo se puede emitir una OC en estado borrador" };

  await prisma.ordenCompra.update({
    where: { id: ocId },
    data: { estado: "emitida", emitidaAt: new Date() },
  });

  revalidatePath(`/dashboard/ordenes/${ocId}`);
  revalidatePath("/dashboard/ordenes");

  return { ok: true };
}

export async function cancelarOrden(ocId: string, motivo: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin"].includes(user.rol)) return { error: "Sin permiso" };

  const oc = await prisma.ordenCompra.findUnique({ where: { id: ocId } });
  if (!oc) return { error: "OC no encontrada" };
  if (["recibida", "cancelada"].includes(oc.estado)) return { error: "No se puede cancelar en el estado actual" };

  await prisma.ordenCompra.update({
    where: { id: ocId },
    data: { estado: "cancelada", observaciones: motivo },
  });

  revalidatePath(`/dashboard/ordenes/${ocId}`);
  revalidatePath("/dashboard/ordenes");

  return { ok: true };
}
