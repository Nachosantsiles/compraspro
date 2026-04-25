import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getFormData } from "@/lib/queries/opis";
import { getPedidoById } from "@/lib/queries/pedidos";
import { OPIForm } from "@/components/opis/OPIForm";

interface PageProps {
  searchParams: { pedidoId?: string };
}

export default async function NuevaOPIPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (!["admin", "comprador"].includes(user.rol)) redirect("/dashboard/opis");

  const [{ empresas, fincas, ccFincas }, pedido] = await Promise.all([
    getFormData(),
    searchParams.pedidoId ? getPedidoById(searchParams.pedidoId) : Promise.resolve(null),
  ]);

  // Normalise pedido for the form (only pass what the form needs)
  const pedidoInicial = pedido
    ? {
        id: pedido.id,
        numero: pedido.numero,
        empresaId: pedido.empresaId,
        solicitante: pedido.solicitante,
        descripcion: pedido.descripcion,
        urgencia: pedido.urgencia,
        items: pedido.items.map((i) => ({
          id: i.id,
          cantidad: i.cantidad,
          unidadMedida: i.unidadMedida,
          descripcion: i.descripcion,
          marca: i.marca,
        })),
      }
    : undefined;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/opis" className="text-xs text-gray-500 hover:text-gray-700">
          ← Volver a OPIs
        </Link>
        <h2 className="text-xl font-bold text-gray-900 mt-2">Nueva OPI</h2>
        <p className="text-sm text-gray-500">
          {pedido ? `Generando OPI desde pedido ${pedido.numero}` : "Completá los datos de la orden de pedido interno"}
        </p>
      </div>

      <OPIForm
        empresas={empresas}
        fincas={fincas}
        ccFincas={ccFincas}
        pedidoInicial={pedidoInicial}
        defaultEmpresaId={user.empresaId ?? undefined}
        userName={user.name}
      />
    </div>
  );
}
