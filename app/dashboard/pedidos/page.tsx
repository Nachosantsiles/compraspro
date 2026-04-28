import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPedidos } from "@/lib/queries/pedidos";
import { verificarPedidosVencidos } from "@/lib/services/vencimientos";
import { StatusBadge, UrgenciaBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EMPRESA_COLORS, formatDate } from "@/lib/utils";
import type { RolEnum } from "@/types";

const FILTROS = [
  { label: "Todos", value: "" },
  { label: "Pend. Aut. Téc.", value: "pendiente_autec" },
  { label: "En cotización", value: "pendiente_cotizacion" },
  { label: "Rechazados", value: "rechazado_autec" },
  { label: "Vencidos", value: "vencido_autec" },
];

interface PageProps {
  searchParams: { estado?: string; search?: string };
}

export default async function PedidosPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  const rol = user.rol as RolEnum;
  const canCreate = ["admin", "tecnico"].includes(rol);
  const canAutec = ["admin", "tecnico"].includes(rol);

  // Verificar vencimientos en cada carga de la página (silencioso)
  await verificarPedidosVencidos().catch((e) =>
    console.error("[verificarPedidosVencidos]", e)
  );

  const pedidos = await getPedidos({
    estado: searchParams.estado,
    empresaId: user.empresaId ?? undefined,
    search: searchParams.search,
  });

  const estadoActivo = searchParams.estado ?? "";

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pedidos</h2>
          <p className="text-sm text-gray-500">{pedidos.length} registros</p>
        </div>
        {canCreate && (
          <Link href="/dashboard/pedidos/nuevo">
            <Button>+ Nuevo pedido</Button>
          </Link>
        )}
      </div>

      {/* Filtros tab-style */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => (
          <Link
            key={f.value}
            href={`/dashboard/pedidos${f.value ? `?estado=${f.value}` : ""}`}
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
        {pedidos.length === 0 ? (
          <EmptyState
            title="Sin pedidos"
            description={estadoActivo ? "No hay pedidos con ese filtro." : "Todavía no se creó ningún pedido."}
            action={
              canCreate ? (
                <Link href="/dashboard/pedidos/nuevo">
                  <Button>Crear primer pedido</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">N° Pedido</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Solicitante</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Departamento</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Urgencia</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-3">
                      <Link
                        href={`/dashboard/pedidos/${p.id}`}
                        className="font-mono text-xs text-blue-600 hover:underline"
                      >
                        {p.numero}
                      </Link>
                      {p.autTecnica?.estado === "pendiente" && canAutec && (
                        <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                          Acción requerida
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: EMPRESA_COLORS[p.empresaId] ?? "#6b7280" }}
                        />
                        <span className="text-gray-700 truncate max-w-[130px]">{p.empresa.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{p.solicitante}</td>
                    <td className="px-6 py-3">
                      {p.centroCosto
                        ? <span className="text-gray-700 text-xs">{p.centroCosto.departamento.nombre}</span>
                        : p.finca
                        ? <span className="text-gray-700 text-xs">{p.finca.nombre}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-3">
                      <UrgenciaBadge urgencia={p.urgencia} />
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge estado={p.estado} />
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      {p.responsable
                        ? <span className="text-gray-800 text-xs">{p.responsable.nombre} {p.responsable.apellido}</span>
                        : <span className="text-gray-400 text-xs italic">Sin asignar</span>}
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
