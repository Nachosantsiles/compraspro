import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPresentacionesAgrupadas } from "@/lib/queries/presentaciones";
import { GestorPresentaciones } from "@/components/presentaciones/GestorPresentaciones";

export default async function PresentacionesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.rol !== "admin") redirect("/dashboard");

  const categorias = await getPresentacionesAgrupadas();

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Tipos de presentación</h2>
        <p className="text-sm text-gray-500 mt-1">
          Administrá las presentaciones disponibles para cada subcategoría de ítems.
          Aparecen como opciones en el formulario de pedidos y OPIs.
        </p>
      </div>

      <GestorPresentaciones categorias={categorias} />
    </div>
  );
}
