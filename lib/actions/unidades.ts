"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Crea una nueva unidad de medida. Disponible para admin, comprador y técnico. */
export async function crearUnidad(nombre: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "comprador", "tecnico"].includes(user.rol))
    return { error: "Sin permisos" };

  const nombreTrim = nombre.trim();
  if (!nombreTrim) return { error: "El nombre es requerido" };

  try {
    // Si ya existe (aunque inactiva), la reactivamos
    const existing = await prisma.unidadMedida.findUnique({ where: { nombre: nombreTrim } });
    if (existing) {
      if (existing.activo) return { success: true, unidad: existing };
      const reactivada = await prisma.unidadMedida.update({
        where: { nombre: nombreTrim },
        data: { activo: true },
      });
      return { success: true, unidad: reactivada };
    }

    const unidad = await prisma.unidadMedida.create({
      data: { nombre: nombreTrim, activo: true },
    });
    return { success: true, unidad };
  } catch (e: any) {
    console.error(e);
    return { error: "Error al crear la unidad de medida" };
  }
}
