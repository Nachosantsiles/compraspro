"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getNotificaciones() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const user = session.user as any;

  return prisma.notificacion.findMany({
    where: { usuarioId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function getNotificacionesNoLeidas() {
  const session = await getServerSession(authOptions);
  if (!session) return 0;

  const user = session.user as any;

  return prisma.notificacion.count({
    where: { usuarioId: user.id, leida: false },
  });
}

export async function marcarLeida(notificacionId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;

  await prisma.notificacion.updateMany({
    where: { id: notificacionId, usuarioId: user.id },
    data: { leida: true },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function marcarTodasLeidas() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;

  await prisma.notificacion.updateMany({
    where: { usuarioId: user.id, leida: false },
    data: { leida: true },
  });

  revalidatePath("/dashboard");
  return { success: true };
}
