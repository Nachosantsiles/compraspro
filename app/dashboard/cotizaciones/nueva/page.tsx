import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CotizacionForm } from "@/components/cotizaciones/CotizacionForm";

interface PageProps {
  searchParams: { opiId?: string };
}

export default async function NuevaCotizacionPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "comprador"].includes(user.rol)) redirect("/dashboard/cotizaciones");

  if (!searchParams.opiId) redirect("/dashboard/opis");

  const [opi, proveedores] = await Promise.all([
    prisma.oPI.findUnique({
      where: { id: searchParams.opiId },
      include: { items: { orderBy: { orden: "asc" } }, empresa: true },
    }),
    prisma.proveedor.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
  ]);

  if (!opi) notFound();

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <Link href={`/dashboard/opis/${opi.id}`} className="text-xs text-gray-500 hover:text-gray-700">
          ← Volver a OPI {opi.numero}
        </Link>
        <h2 className="text-xl font-bold text-gray-900 mt-2">Nueva cotización</h2>
        <p className="text-sm text-gray-500">Ingresá los precios por ítem del proveedor</p>
      </div>

      <CotizacionForm opi={opi} proveedores={proveedores} />
    </div>
  );
}
