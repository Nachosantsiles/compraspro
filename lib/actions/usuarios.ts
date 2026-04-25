"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function crearUsuario(data: {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: string;
  empresaId?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };
  const user = session.user as any;
  if (user.rol !== "admin") return { error: "Solo administradores pueden crear usuarios" };

  if (!data.nombre || !data.apellido || !data.email || !data.password) {
    return { error: "Todos los campos obligatorios deben completarse" };
  }

  const existe = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (existe) return { error: "Ya existe un usuario con ese email" };

  const hash = await bcrypt.hash(data.password, 10);

  await prisma.usuario.create({
    data: {
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
      email: data.email.trim().toLowerCase(),
      password: hash,
      rol: data.rol,
      empresaId: data.empresaId || null,
    },
  });

  revalidatePath("/dashboard/usuarios");
  return { ok: true };
}

export async function toggleUsuarioActivo(id: string, activo: boolean) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };
  const user = session.user as any;
  if (user.rol !== "admin") return { error: "Sin permiso" };
  if (user.id === id) return { error: "No podés desactivar tu propio usuario" };

  await prisma.usuario.update({ where: { id }, data: { activo } });
  revalidatePath("/dashboard/usuarios");
  return { ok: true };
}

export async function cambiarRol(id: string, rol: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };
  const user = session.user as any;
  if (user.rol !== "admin") return { error: "Sin permiso" };
  if (user.id === id) return { error: "No podés cambiar tu propio rol" };

  await prisma.usuario.update({ where: { id }, data: { rol } });
  revalidatePath("/dashboard/usuarios");
  return { ok: true };
}
