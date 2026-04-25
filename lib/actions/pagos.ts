"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { nextPagoNumero } from "@/lib/numbers";

export async function registrarPago(data: {
  medio: string;
  moneda: string;
  fecha: string;
  referencia?: string;
  observaciones?: string;
  facturas: { facturaId: string; monto: number }[];
}) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "No autenticado" };

  const user = session.user as any;
  if (!["admin", "finanzas"].includes(user.rol)) return { error: "Sin permiso" };

  if (!data.facturas.length) return { error: "Seleccioná al menos una factura" };

  const total = data.facturas.reduce((acc, f) => acc + f.monto, 0);
  if (total <= 0) return { error: "El monto total debe ser mayor a 0" };

  const numero = await nextPagoNumero();

  await prisma.$transaction(async (tx) => {
    const pago = await tx.pago.create({
      data: {
        numero,
        creadorId: user.id,
        medio: data.medio,
        moneda: data.moneda,
        total,
        fecha: new Date(data.fecha),
        referencia: data.referencia || null,
        observaciones: data.observaciones || null,
        facturas: {
          create: data.facturas.map((f) => ({
            facturaId: f.facturaId,
            monto: f.monto,
          })),
        },
      },
    });

    // Actualizar estado de cada factura
    for (const f of data.facturas) {
      const factura = await tx.factura.findUnique({
        where: { id: f.facturaId },
        include: { pagos: true },
      });
      if (!factura) continue;

      const totalPagado = factura.pagos.reduce((acc, p) => acc + p.monto, 0) + f.monto;
      const nuevoEstado = totalPagado >= factura.total ? "pagada" : "pagada_parcial";

      await tx.factura.update({
        where: { id: f.facturaId },
        data: { estado: nuevoEstado },
      });
    }

    return pago;
  });

  revalidatePath("/dashboard/pagos");
  revalidatePath("/dashboard/facturas");

  return { ok: true, numero };
}
