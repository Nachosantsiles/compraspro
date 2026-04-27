"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function crearPresentacion(nombre: string, subCategoriaId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const nombreTrim = nombre.trim();
  if (!nombreTrim) return { error: "El nombre no puede estar vacío" };
  if (!subCategoriaId) return { error: "Subcategoría requerida" };

  // Reactivar si ya existe inactiva
  const existing = await prisma.presentacion.findFirst({
    where: { nombre: nombreTrim, subCategoriaId },
  });

  if (existing) {
    if (!existing.activo) {
      const reactivada = await prisma.presentacion.update({
        where: { id: existing.id },
        data: { activo: true },
      });
      return { success: true, presentacion: reactivada };
    }
    return { error: "Esa presentación ya existe para esta subcategoría" };
  }

  const presentacion = await prisma.presentacion.create({
    data: { nombre: nombreTrim, subCategoriaId, activo: true },
  });

  return { success: true, presentacion };
}
