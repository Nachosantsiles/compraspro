import { NextResponse } from "next/server";
import { verificarPedidosVencidos } from "@/lib/services/vencimientos";

// Puede ser llamado por un cron externo (Vercel Cron, cURL diario, etc.)
// Opcionalmente protegido con CRON_SECRET en el header Authorization
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await verificarPedidosVencidos();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/verificar-vencimientos]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
