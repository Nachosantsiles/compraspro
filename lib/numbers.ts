import { prisma } from "@/lib/prisma";

export async function nextPedidoNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.pedido.count();
  return `PED-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function nextOPINumero(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.oPI.count();
  return `OPI-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function nextOCNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.ordenCompra.count();
  return `OC-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function nextCotizNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.cotizacion.count();
  return `COT-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function nextRecepcionNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.recepcion.count();
  return `REC-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function nextReclamoNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.reclamo.count();
  return `REC-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function nextPagoNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.pago.count();
  return `PAG-${year}-${String(count + 1).padStart(4, "0")}`;
}
