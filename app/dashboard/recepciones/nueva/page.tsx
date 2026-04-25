import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrdenesParaRecepcion } from "@/lib/queries/recepciones";
import { RecepcionForm } from "@/components/recepciones/RecepcionForm";
import { formatCurrency } from "@/lib/utils";

interface PageProps {
  searchParams: { ocId?: string };
}

export default async function NuevaRecepcionPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "almacen"].includes(user.rol)) redirect("/dashboard/recepciones");

  const ordenes = await getOrdenesParaRecepcion(user.rol === "admin" ? undefined : user.empresaId);
  const ocSeleccionada = searchParams.ocId
    ? ordenes.find((o) => o.id === searchParams.ocId) ?? null
    : null;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/recepciones" className="text-xs text-gray-500 hover:text-gray-700">
          ← Recepciones
        </Link>
        <h2 className="text-xl font-bold text-gray-900 mt-2">Nueva recepción</h2>
        <p className="text-sm text-gray-500">Registrá las cantidades recibidas por ítem</p>
      </div>

      {!ocSeleccionada ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Seleccioná la Orden de Compra</p>
          {ordenes.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-sm text-gray-500">No hay OCs emitidas disponibles para recepción.</p>
              <Link href="/dashboard/ordenes" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                Ver órdenes de compra →
              </Link>
            </div>
          ) : (
            ordenes.map((oc) => (
              <Link
                key={oc.id}
                href={`/dashboard/recepciones/nueva?ocId=${oc.id}`}
                className="block border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm font-semibold text-gray-900">{oc.numero}</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {oc.proveedor.nombre} · {oc.opi.empresa.nombre} · OPI {oc.opi.numero}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {oc.items.length} ítems ·{" "}
                      {oc.items.filter((i) => i.cantRecibida < i.cantidad).length} pendientes de recepción
                    </p>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">Seleccionar →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        <RecepcionForm oc={ocSeleccionada as any} />
      )}
    </div>
  );
}
