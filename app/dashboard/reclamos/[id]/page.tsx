import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getReclamoById } from "@/lib/queries/reclamos";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ReclamoActions } from "@/components/reclamos/ReclamoActions";
import { EMPRESA_COLORS, formatDate } from "@/lib/utils";
import type { RolEnum } from "@/types";

const RESOLUCION_LABELS: Record<string, string> = {
  reposicion: "Reposición de mercadería",
  nota_de_credito: "Nota de crédito",
  baja_item: "Baja del ítem",
};

export default async function ReclamoDetallePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as any;
  const rol = user.rol as RolEnum;

  const reclamo = await getReclamoById(params.id);
  if (!reclamo) notFound();

  const canAct = ["admin", "almacen", "comprador"].includes(rol);

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/reclamos" className="text-xs text-gray-500 hover:text-gray-700">
            ← Reclamos
          </Link>
          <h2 className="text-xl font-bold text-gray-900 mt-1 font-mono">{reclamo.numero}</h2>
        </div>
        <StatusBadge estado={reclamo.estado} />
      </div>

      <Card>
        <CardHeader><CardTitle>Datos del reclamo</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Empresa</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EMPRESA_COLORS[reclamo.recepcion.oc.opi.empresa.nombre] ?? "#6b7280" }} />
                <span className="font-medium">{reclamo.recepcion.oc.opi.empresa.nombre}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Proveedor</p>
              <p className="font-medium">{reclamo.proveedor.nombre}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Recepción</p>
              <Link href={`/dashboard/recepciones/${reclamo.recepcion.id}`} className="font-mono text-blue-600 hover:underline text-sm">
                {reclamo.recepcion.numero}
              </Link>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">OC</p>
              <Link href={`/dashboard/ordenes/${reclamo.recepcion.oc.id}`} className="font-mono text-blue-600 hover:underline text-sm">
                {reclamo.recepcion.oc.numero}
              </Link>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Creado</p>
              <p>{formatDate(reclamo.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Creado por</p>
              <p>{reclamo.creador.nombre} {reclamo.creador.apellido}</p>
            </div>
            {reclamo.fechaEnvio && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Enviado al proveedor</p>
                <p>{formatDate(reclamo.fechaEnvio)}</p>
              </div>
            )}
            {reclamo.fechaRespuesta && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Respuesta recibida</p>
                <p>{formatDate(reclamo.fechaRespuesta)}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Motivo</p>
            <p className="text-gray-800 bg-gray-50 rounded-lg p-3">{reclamo.motivo}</p>
          </div>

          {reclamo.descripcion && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Descripción adicional</p>
              <p className="text-gray-600 italic">{reclamo.descripcion}</p>
            </div>
          )}

          {reclamo.estado === "resuelto" && reclamo.resolucion && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-green-900">Reclamo resuelto</p>
              <p className="text-sm text-green-700">
                Resolución: <strong>{RESOLUCION_LABELS[reclamo.resolucion] ?? reclamo.resolucion}</strong>
              </p>
              {reclamo.notaCredito && (
                <p className="text-sm text-green-700">
                  Nota de crédito: <strong>${reclamo.notaCredito.toFixed(2)}</strong>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ReclamoActions reclamoId={reclamo.id} estado={reclamo.estado} canAct={canAct} />
    </div>
  );
}
