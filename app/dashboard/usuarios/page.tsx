import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsuarios } from "@/lib/queries/usuarios";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ROL_LABELS, EMPRESA_COLORS } from "@/lib/utils";
import { UsuarioToggle } from "@/components/usuarios/UsuarioToggle";

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.rol !== "admin") redirect("/dashboard");

  const usuarios = await getUsuarios();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usuarios</h2>
          <p className="text-sm text-gray-500">
            {usuarios.filter((u) => u.activo).length} activos · {usuarios.filter((u) => !u.activo).length} inactivos
          </p>
        </div>
        <Link href="/dashboard/usuarios/nuevo">
          <Button size="sm">+ Nuevo usuario</Button>
        </Link>
      </div>

      <Card>
        {usuarios.length === 0 ? (
          <EmptyState title="Sin usuarios" description="Creá usuarios para dar acceso al sistema." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Pedidos</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">OPIs</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuarios.map((u) => (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.activo ? "opacity-50" : ""}`}>
                    <td className="px-6 py-3">
                      <p className="font-semibold text-gray-900">{u.nombre} {u.apellido}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-6 py-3">
                      {u.empresa ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: u.empresa.color }} />
                          <span className="text-gray-700">{u.empresa.nombre}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Global</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                        {ROL_LABELS[u.rol] ?? u.rol}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-600">{u._count.pedidosCreados}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{u._count.opisCreadas}</td>
                    <td className="px-6 py-3">
                      <UsuarioToggle userId={u.id} activo={u.activo} />
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400 text-right">
                      {/* future: edit */}
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
