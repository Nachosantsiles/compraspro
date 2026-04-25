import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPagos } from "@/lib/queries/pagos";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, formatCurrency } from "@/lib/utils";

const MEDIO_LABELS: Record<string, string> = {
  transferencia: "Transferencia",
  cheque: "Cheque",
  efectivo: "Efectivo",
};

export default async function PagosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "finanzas"].includes(user.rol)) redirect("/dashboard");

  const pagos = await getPagos();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pagos</h2>
          <p className="text-sm text-gray-500">{pagos.length} registrados</p>
        </div>
        <Link href="/dashboard/pagos/nuevo">
          <Button size="sm">+ Registrar pago</Button>
        </Link>
      </div>

      <Card>
        {pagos.length === 0 ? (
          <EmptyState title="Sin pagos" description="Registrá pagos asociados a facturas pendientes." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Facturas</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Medio</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Referencia</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-900">{p.numero}</td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.facturas.map((pf) => (
                          <span key={pf.factura.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                            {pf.factura.numero}
                          </span>
                        ))}
                      </div>
                      {p.facturas[0] && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">
                          {p.facturas[0].factura.proveedor.nombre}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{MEDIO_LABELS[p.medio] ?? p.medio}</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900">
                      {formatCurrency(p.total, p.moneda)}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(p.fecha)}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{p.referencia ?? "—"}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {p.creador.nombre} {p.creador.apellido}
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
