import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrdenesEmitidas } from "@/lib/queries/facturas";
import { FacturaForm } from "@/components/facturas/FacturaForm";

interface PageProps {
  searchParams: { ocId?: string };
}

export default async function NuevaFacturaPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "finanzas"].includes(user.rol)) redirect("/dashboard/facturas");

  const ordenes = await getOrdenesEmitidas(user.rol === "admin" ? undefined : user.empresaId);

  const ocSeleccionada = searchParams.ocId
    ? ordenes.find((o) => o.id === searchParams.ocId) ?? null
    : null;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard/facturas" className="text-xs text-gray-500 hover:text-gray-700">
          ← Facturas
        </Link>
        <h2 className="text-xl font-bold text-gray-900 mt-2">Nueva factura</h2>
        <p className="text-sm text-gray-500">Registrá una factura contra una OC emitida</p>
      </div>

      {!ocSeleccionada ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Seleccioná la Orden de Compra</p>
          {ordenes.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-sm text-gray-500">No hay OCs emitidas disponibles.</p>
              <Link href="/dashboard/ordenes" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                Ver órdenes de compra →
              </Link>
            </div>
          ) : (
            ordenes.map((oc) => (
              <Link
                key={oc.id}
                href={`/dashboard/facturas/nueva?ocId=${oc.id}`}
                className="block border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm font-semibold text-gray-900">{oc.numero}</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {oc.proveedor.nombre} · {oc.opi.empresa.nombre} · OPI {oc.opi.numero}
                    </p>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">Seleccionar →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        <FacturaForm oc={ocSeleccionada} />
      )}
    </div>
  );
}
