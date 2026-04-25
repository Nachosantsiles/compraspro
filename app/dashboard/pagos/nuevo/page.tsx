import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getFacturasPendientesPago } from "@/lib/queries/pagos";
import { PagoForm } from "@/components/pagos/PagoForm";

export default async function NuevoPagoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "finanzas"].includes(user.rol)) redirect("/dashboard/pagos");

  const facturas = await getFacturasPendientesPago(user.rol === "admin" ? undefined : user.empresaId);

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/pagos" className="text-xs text-gray-500 hover:text-gray-700">
          ← Pagos
        </Link>
        <h2 className="text-xl font-bold text-gray-900 mt-2">Registrar pago</h2>
        <p className="text-sm text-gray-500">Seleccioná las facturas a pagar e ingresá los datos del pago</p>
      </div>

      <PagoForm facturasPendientes={facturas as any} />
    </div>
  );
}
