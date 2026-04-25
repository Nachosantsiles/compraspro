import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getArticulos } from "@/lib/queries/stock";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";

export default async function StockPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "almacen"].includes(user.rol)) redirect("/dashboard");

  const articulos = await getArticulos();

  const bajoMinimo = articulos.filter((a) => a.activo && a.stockActual <= a.stockMinimo).length;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Stock</h2>
        <p className="text-sm text-gray-500">
          {articulos.length} artículos
          {bajoMinimo > 0 && (
            <span className="ml-2 text-red-600 font-medium">· {bajoMinimo} bajo mínimo</span>
          )}
        </p>
      </div>

      {bajoMinimo > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3">
          <p className="text-sm font-semibold text-red-900">
            {bajoMinimo} artículo{bajoMinimo !== 1 ? "s" : ""} con stock igual o menor al mínimo
          </p>
        </div>
      )}

      <Card>
        {articulos.length === 0 ? (
          <EmptyState
            title="Sin artículos"
            description="El stock se actualiza automáticamente al recibir y aprobar recepciones."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Unidad</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock actual</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock mín.</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock máx.</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ubicación</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {articulos.map((a) => {
                  const bajo = a.stockActual <= a.stockMinimo;
                  return (
                    <tr key={a.id} className={`hover:bg-gray-50 transition-colors ${bajo && a.activo ? "bg-red-50/40" : ""}`}>
                      <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-700">{a.codigo}</td>
                      <td className="px-6 py-3 text-gray-800">{a.descripcion}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{a.unidadMedida}</td>
                      <td className={`px-6 py-3 text-right font-bold ${bajo && a.activo ? "text-red-600" : "text-gray-900"}`}>
                        {a.stockActual}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-500">{a.stockMinimo}</td>
                      <td className="px-6 py-3 text-right text-gray-500">{a.stockMaximo ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs">{a.ubicacion ?? "—"}</td>
                      <td className="px-6 py-3">
                        {a.activo ? (
                          bajo
                            ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Bajo mínimo</span>
                            : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">OK</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactivo</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
