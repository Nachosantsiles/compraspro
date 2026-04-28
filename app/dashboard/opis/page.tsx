import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOPIs } from "@/lib/queries/opis";
import { StatusBadge, UrgenciaBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { EMPRESA_COLORS, formatDate } from "@/lib/utils";
import type { RolEnum } from "@/types";

const FILTROS = [
  { label: "Todas", value: "" },
  { label: "Pend. cotización", value: "pendiente_cotizacion" },
  { label: "Pend. aut. fin.", value: "pendiente_autfin" },
  { label: "Aprobadas", value: "aprobada_autfin" },
  { label: "OC Generada", value: "oc_generada" },
];

interface PageProps {
  searchParams: { estado?: string };
}

export default async function OPIsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  const rol = user.rol as RolEnum;

  const opis = await getOPIs({
    estado: searchParams.estado,
    empresaId: user.empresaId ?? undefined,
  });

  const estadoActivo = searchParams.estado ?? "";

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">OPIs</h2>
          <p className="text-sm text-gray-500">{opis.length} registros</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => (
          <Link
            key={f.value}
            href={`/dashboard/opis${f.value ? `?estado=${f.value}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              estadoActivo === f.value
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card>
        {opis.length === 0 ? (
          <EmptyState
            title="Sin OPIs"
            description="Las OPIs se generan automáticamente al aprobar técnicamente un pedido."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Solicitante</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Urgencia</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Cots.</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {opis.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link
                        href={`/dashboard/opis/${o.id}`}
                        className="font-mono text-xs text-blue-600 hover:underline"
                      >
                        {o.numero}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: EMPRESA_COLORS[o.empresaId] ?? "#6b7280" }}
                        />
                        <span className="text-gray-700 truncate max-w-[130px]">{o.empresa.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{o.solicitante}</td>
                    <td className="px-6 py-3">
                      <p className="text-gray-700 truncate max-w-[200px]">{o.descripcion}</p>
                    </td>
                    <td className="px-6 py-3">
                      <UrgenciaBadge urgencia={o.urgencia} />
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge estado={o.estado} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-xs font-semibold text-gray-600">
                        {o._count.cotizaciones}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
