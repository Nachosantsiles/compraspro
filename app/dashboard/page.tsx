import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats, getRecentActivity, getPipelineCounts } from "@/lib/queries/dashboard";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ESTADO_COLORS, ESTADO_LABELS, EMPRESA_COLORS, formatDate } from "@/lib/utils";
import type { RolEnum } from "@/types";

// ── Icons inline para server component ───────────────────────────────
function Icon({ d, className = "w-5 h-5" }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const ICONS = {
  pedido: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  opi: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  autfin: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  oc: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
  factura: "M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z",
  reclamo: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  const rol = user.rol as RolEnum;
  const empresaId = user.empresaId as string | null;
  const empresaColor = user.empresaColor as string | undefined;

  const [stats, activity, pipeline] = await Promise.all([
    getDashboardStats(rol, empresaId),
    getRecentActivity(rol, empresaId),
    getPipelineCounts(),
  ]);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {saludo}, {user.name?.split(" ")[0]}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {formatDate(new Date(), "EEEE d 'de' MMMM yyyy")} ·{" "}
          <span className="capitalize font-medium" style={{ color: empresaColor ?? "#6b7280" }}>
            {user.empresaNombre ?? "Grupo Cazorla"}
          </span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {(rol === "admin" || rol === "tecnico") && (
          <StatCard
            title="Pedidos pendientes"
            value={stats.pedidosPendientes}
            description="Esperan aut. técnica"
            href="/dashboard/pedidos"
            accent={empresaColor ?? "#185FA5"}
            urgent={stats.pedidosPendientes > 0}
            icon={<Icon d={ICONS.pedido} />}
          />
        )}
        {(rol === "admin" || rol === "comprador") && (
          <StatCard
            title="OPIs sin cotizar"
            value={stats.opisPendienteCot}
            description="Requieren cotización"
            href="/dashboard/opis"
            accent="#f59e0b"
            urgent={stats.opisPendienteCot > 0}
            icon={<Icon d={ICONS.opi} />}
          />
        )}
        {(rol === "admin" || rol === "finanzas") && (
          <StatCard
            title="Aut. financiera"
            value={stats.opisPendienteAutfin}
            description="OPIs para aprobar"
            href="/dashboard/autorizaciones"
            accent="#8b5cf6"
            urgent={stats.opisPendienteAutfin > 0}
            icon={<Icon d={ICONS.autfin} />}
          />
        )}
        {(rol === "admin" || rol === "comprador" || rol === "finanzas") && (
          <StatCard
            title="OCs en tránsito"
            value={stats.ocEmitidas}
            description="Emitidas, sin recibir"
            href="/dashboard/ordenes"
            accent="#0ea5e9"
            icon={<Icon d={ICONS.oc} />}
          />
        )}
        {(rol === "admin" || rol === "finanzas") && (
          <StatCard
            title="Facturas por vencer"
            value={stats.facturasVencer}
            description="Próximos 3 días"
            href="/dashboard/facturas"
            accent="#ef4444"
            urgent={stats.facturasVencer > 0}
            icon={<Icon d={ICONS.factura} />}
          />
        )}
        {(rol === "admin" || rol === "almacen" || rol === "comprador") && (
          <StatCard
            title="Reclamos activos"
            value={stats.reclamosAbiertos}
            description="Abiertos / en negociación"
            href="/dashboard/reclamos"
            accent="#f97316"
            urgent={stats.reclamosAbiertos > 0}
            icon={<Icon d={ICONS.reclamo} />}
          />
        )}
        <StatCard
          title="Pedidos hoy"
          value={stats.totalPedidosHoy}
          description="Creados en el día"
          accent="#10b981"
          icon={<Icon d={ICONS.pedido} />}
        />
        <StatCard
          title="OCs del mes"
          value={stats.totalOCMes}
          description="Órdenes generadas"
          accent="#6366f1"
          icon={<Icon d={ICONS.oc} />}
        />
      </div>

      {/* Pipeline + Actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline de compras */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pipeline de compras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pipeline.map((stage, i) => {
              const maxCount = Math.max(...pipeline.map((s) => s.count), 1);
              const pct = Math.round((stage.count / maxCount) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">{stage.label}</span>
                    <span className="text-xs font-semibold text-gray-900">{stage.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: ["#185FA5", "#f59e0b", "#8b5cf6", "#10b981"][i] ?? "#6b7280",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Pedidos recientes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pedidos recientes</CardTitle>
            <a href="/dashboard/pedidos" className="text-xs text-blue-600 hover:underline">
              Ver todos
            </a>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {activity.pedidos.length === 0 ? (
              <CardContent>
                <p className="text-sm text-gray-400 text-center py-4">No hay pedidos aún</p>
              </CardContent>
            ) : (
              activity.pedidos.map((p) => (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500">{p.numero}</span>
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: EMPRESA_COLORS[p.empresaId] ?? "#6b7280" }}
                      />
                    </div>
                    <p className="text-sm text-gray-800 truncate mt-0.5">{p.descripcion}</p>
                    <p className="text-xs text-gray-400">
                      {p.creador.nombre} {p.creador.apellido} · {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ESTADO_COLORS[p.estado] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {ESTADO_LABELS[p.estado] ?? p.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* OPIs recientes + Reclamos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OPIs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>OPIs recientes</CardTitle>
            <a href="/dashboard/opis" className="text-xs text-blue-600 hover:underline">
              Ver todas
            </a>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {activity.opis.length === 0 ? (
              <CardContent>
                <p className="text-sm text-gray-400 text-center py-4">No hay OPIs aún</p>
              </CardContent>
            ) : (
              activity.opis.map((o) => (
                <div key={o.id} className="px-6 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-mono text-gray-500">{o.numero}</span>
                    <p className="text-sm text-gray-800 truncate">{o.descripcion}</p>
                    <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ESTADO_COLORS[o.estado] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {ESTADO_LABELS[o.estado] ?? o.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Reclamos activos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Reclamos activos</CardTitle>
            <a href="/dashboard/reclamos" className="text-xs text-blue-600 hover:underline">
              Ver todos
            </a>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {activity.reclamos.length === 0 ? (
              <CardContent>
                <p className="text-sm text-gray-400 text-center py-4">Sin reclamos activos</p>
              </CardContent>
            ) : (
              activity.reclamos.map((r) => (
                <div key={r.id} className="px-6 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-mono text-gray-500">{r.numero}</span>
                    <p className="text-sm text-gray-800 truncate">{r.proveedor.nombre}</p>
                    <p className="text-xs text-gray-400 truncate">{r.motivo}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ESTADO_COLORS[r.estado] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {ESTADO_LABELS[r.estado] ?? r.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
