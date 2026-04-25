"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function crearProveedor(data: {
  nombre: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };
  const user = session.user as any;
  if (!["admin", "comprador"].includes(user.rol)) return { error: "Sin permiso" };

  if (!data.nombre.trim()) return { error: "El nombre es obligatorio" };

  if (data.cuit) {
    const existe = await prisma.proveedor.findUnique({ where: { cuit: data.cuit } });
    if (existe) return { error: "Ya existe un proveedor con ese CUIT" };
  }

  const proveedor = await prisma.proveedor.create({
    data: {
      nombre: data.nombre.trim(),
      cuit: data.cuit?.trim() || null,
      email: data.email?.trim() || null,
      telefono: data.telefono?.trim() || null,
      direccion: data.direccion?.trim() || null,
    },
  });

  revalidatePath("/dashboard/proveedores");
  return { ok: true, proveedorId: proveedor.id };
}

export async function editarProveedor(id: string, data: {
  nombre: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };
  const user = session.user as any;
  if (!["admin", "comprador"].includes(user.rol)) return { error: "Sin permiso" };

  if (!data.nombre.trim()) return { error: "El nombre es obligatorio" };

  if (data.cuit) {
    const existe = await prisma.proveedor.findFirst({
      where: { cuit: data.cuit, NOT: { id } },
    });
    if (existe) return { error: "Ya existe otro proveedor con ese CUIT" };
  }

  await prisma.proveedor.update({
    where: { id },
    data: {
      nombre: data.nombre.trim(),
      cuit: data.cuit?.trim() || null,
      email: data.email?.trim() || null,
      telefono: data.telefono?.trim() || null,
      direccion: data.direccion?.trim() || null,
    },
  });

  revalidatePath("/dashboard/proveedores");
  revalidatePath(`/dashboard/proveedores/${id}`);
  return { ok: true };
}

export async function toggleProveedorActivo(id: string, activo: boolean) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };
  const user = session.user as any;
  if (!["admin"].includes(user.rol)) return { error: "Sin permiso" };

  await prisma.proveedor.update({ where: { id }, data: { activo } });
  revalidatePath("/dashboard/proveedores");
  revalidatePath(`/dashboard/proveedores/${id}`);
  return { ok: true };
}
