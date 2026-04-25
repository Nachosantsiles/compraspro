"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/** Crea una nueva categoría. Disponible solo para admin y comprador. */
export async function crearCategoria(nombre: string, tipo: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "comprador", "tecnico"].includes(user.rol))
    return { error: "Sin permisos" };

  const nombreTrim = nombre.trim();
  if (!nombreTrim) return { error: "El nombre es requerido" };
  if (!["fabrica", "finca", "todas"].includes(tipo))
    return { error: "Tipo inválido" };

  try {
    const categoria = await prisma.categoria.create({
      data: { nombre: nombreTrim, tipo, activo: true },
      include: { subcategorias: true },
    });

    revalidatePath("/dashboard/pedidos/nuevo");
    revalidatePath("/dashboard/opis/nuevo");
    return { success: true, categoria };
  } catch (e: any) {
    console.error(e);
    return { error: "Error al crear la categoría" };
  }
}

/** Crea una nueva subcategoría dentro de una categoría existente. */
export async function crearSubCategoria(nombre: string, categoriaId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "comprador", "tecnico"].includes(user.rol))
    return { error: "Sin permisos" };

  const nombreTrim = nombre.trim();
  if (!nombreTrim) return { error: "El nombre es requerido" };
  if (!categoriaId) return { error: "La categoría es requerida" };

  try {
    const sub = await prisma.subCategoria.create({
      data: { nombre: nombreTrim, categoriaId, activo: true },
    });

    revalidatePath("/dashboard/pedidos/nuevo");
    revalidatePath("/dashboard/opis/nuevo");
    return { success: true, subCategoria: sub };
  } catch (e: any) {
    console.error(e);
    return { error: "Error al crear la subcategoría" };
  }
}
