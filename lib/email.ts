import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? "ComprasPro <noreply@cazorla.com>";

function getTransporter() {
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  // Sin SMTP configurado → sólo log en consola
  return null;
}

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[EMAIL - no SMTP] To: ${to} | ${subject}`);
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
  });
}

export function templatePedidoVencido(params: {
  nombre: string;
  numeroPedido: string;
  descripcion: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1f2937; margin-bottom: 8px;">Pedido vencido por falta de autorización técnica</h2>
      <p style="color: #6b7280; font-size: 14px;">Hola <strong>${params.nombre}</strong>,</p>
      <p style="color: #374151; font-size: 14px;">
        El pedido <strong>${params.numeroPedido}</strong> — "${params.descripcion}" fue dado de baja automáticamente
        porque no recibió autorización técnica en los <strong>3 días hábiles</strong> siguientes a su creación.
      </p>
      <p style="color: #374151; font-size: 14px;">
        No es posible continuar con la gestión de compra. Si el insumo sigue siendo necesario,
        deberás crear un nuevo pedido.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">
        Este mensaje fue generado automáticamente por <strong>ComprasPro</strong>.
      </p>
    </div>
  `;
}
