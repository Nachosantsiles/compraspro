import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getFormData } from "@/lib/queries/opis";
import { getAllCategorias } from "@/lib/queries/categorias";
import { getUnidades } from "@/lib/queries/unidades";
import { PedidoForm } from "@/components/pedidos/PedidoForm";

export default async function NuevoPedidoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "tecnico"].includes(user.rol)) redirect("/dashboard/pedidos");

  const [{ empresas, fincas, ccFincas }, categorias, unidadesDB] = await Promise.all([
    getFormData(),
    getAllCategorias(),
    getUnidades(),
  ]);
  const unidades = unidadesDB.map((u) => u.nombre);

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/pedidos" className="text-xs text-gray-500 hover:text-gray-700">
          ← Volver a pedidos
        </Link>
        <h2 className="text-xl font-bold text-gray-900 mt-2">Nuevo pedido</h2>
        <p className="text-sm text-gray-500">Completá los datos y agregá los ítems a solicitar</p>
      </div>

      <PedidoForm
        empresas={empresas}
        fincas={fincas}
        ccFincas={ccFincas}
        categorias={categorias}
        unidades={unidades}
        defaultEmpresaId={user.empresaId ?? undefined}
        userName={`${user.name}`}
      />
    </div>
  );
}
