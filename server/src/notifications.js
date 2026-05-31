import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(__dirname, '../../public/images/sk.png');

const businessName = process.env.BUSINESS_NAME || 'Natural Sound Glamping';
const businessPhone = process.env.BUSINESS_PHONE || '+57 312 713 1999';
const businessWhatsApp = process.env.BUSINESS_WHATSAPP || '573127131999';

const crearTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const formatearFecha = (fecha) => {
  if (!fecha) return fecha;
  const [año, mes, dia] = fecha.split('-');
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${dia} de ${meses[Number(mes) - 1]} de ${año}`;
};

const formatearPrecio = (valor) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(valor) || 0);

const htmlEmailConfirmacion = (reserva) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reserva Confirmada</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">

          <!-- Encabezado -->
          <tr>
            <td style="background:linear-gradient(135deg,#284735,#46654f);padding:40px 40px 30px;text-align:center;">
              <img src="cid:logo_naturalsound" alt="${businessName}" style="height:120px;width:auto;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
              <p style="margin:0;color:#c8e6c9;font-size:15px;">Naturaleza · Descanso · Experiencias</p>
            </td>
          </tr>

          <!-- Confirmación -->
          <tr>
            <td style="padding:35px 40px 20px;text-align:center;">
              <div style="display:inline-block;background:#e8f5e9;border-radius:50%;padding:16px;margin-bottom:16px;">
                <span style="font-size:36px;">✅</span>
              </div>
              <h2 style="margin:0 0 8px;color:#284735;font-size:22px;">¡Tu reserva está confirmada!</h2>
              <p style="margin:0;color:#5a7a62;font-size:15px;">Hola <strong>${reserva.nombre_huesped}</strong>, nos alegra tenerte con nosotros.</p>
            </td>
          </tr>

          <!-- Detalles de reserva -->
          <tr>
            <td style="padding:0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fdf9;border:1px solid #d7e8da;border-radius:10px;">
                <tr>
                  <td style="padding:20px 24px 10px;">
                    <p style="margin:0 0 16px;color:#284735;font-size:16px;font-weight:bold;border-bottom:1px solid #d7e8da;padding-bottom:12px;">Detalles de tu reserva</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:7px 0;color:#5a7a62;font-size:14px;width:45%;">🏕️ Alojamiento</td>
                        <td style="padding:7px 0;color:#284735;font-size:14px;font-weight:600;">${reserva.hospedaje}</td>
                      </tr>
                      <tr style="background:#f0f7f1;">
                        <td style="padding:7px 8px;color:#5a7a62;font-size:14px;">📅 Check-in</td>
                        <td style="padding:7px 8px;color:#284735;font-size:14px;font-weight:600;">${formatearFecha(reserva.check_in)}</td>
                      </tr>
                      <tr>
                        <td style="padding:7px 0;color:#5a7a62;font-size:14px;">📅 Check-out</td>
                        <td style="padding:7px 0;color:#284735;font-size:14px;font-weight:600;">${formatearFecha(reserva.check_out)}</td>
                      </tr>
                      <tr style="background:#f0f7f1;">
                        <td style="padding:7px 8px;color:#5a7a62;font-size:14px;">👥 Huéspedes</td>
                        <td style="padding:7px 8px;color:#284735;font-size:14px;font-weight:600;">${reserva.numero_huespedes} persona(s)</td>
                      </tr>
                      ${reserva.servicio_adicional && reserva.servicio_adicional !== 'N/A' ? `
                      <tr>
                        <td style="padding:7px 0;color:#5a7a62;font-size:14px;">✨ Servicio adicional</td>
                        <td style="padding:7px 0;color:#284735;font-size:14px;font-weight:600;">${reserva.servicio_adicional}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Resumen de pago -->
          <tr>
            <td style="padding:0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;">
                <tr>
                  <td style="padding:16px 24px 8px;">
                    <p style="margin:0 0 12px;color:#f57f17;font-size:15px;font-weight:bold;">💰 Resumen de pago</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:5px 0;color:#795548;font-size:14px;">Valor alojamiento</td>
                        <td style="padding:5px 0;color:#284735;font-size:14px;text-align:right;">${formatearPrecio(reserva.valor_alojamiento)}</td>
                      </tr>
                      ${Number(reserva.valor_servicio_adicional) > 0 ? `
                      <tr>
                        <td style="padding:5px 0;color:#795548;font-size:14px;">Servicio adicional</td>
                        <td style="padding:5px 0;color:#284735;font-size:14px;text-align:right;">${formatearPrecio(reserva.valor_servicio_adicional)}</td>
                      </tr>` : ''}
                      ${Number(reserva.abono) > 0 ? `
                      <tr>
                        <td style="padding:5px 0;color:#795548;font-size:14px;">Abono pagado</td>
                        <td style="padding:5px 0;color:#388e3c;font-size:14px;font-weight:600;text-align:right;">− ${formatearPrecio(reserva.abono)}</td>
                      </tr>` : ''}
                      <tr style="border-top:1px solid #ffe082;">
                        <td style="padding:10px 0 5px;color:#284735;font-size:15px;font-weight:bold;">Saldo pendiente</td>
                        <td style="padding:10px 0 5px;color:#c62828;font-size:16px;font-weight:bold;text-align:right;">${formatearPrecio(reserva.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Info de contacto -->
          <tr>
            <td style="padding:0 40px 30px;text-align:center;">
              <p style="color:#5a7a62;font-size:13px;margin:0 0 12px;">¿Tienes preguntas? Contáctanos:</p>
              <a href="https://wa.me/${businessWhatsApp}" style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;padding:11px 24px;border-radius:25px;font-size:14px;font-weight:600;">
                💬 WhatsApp ${businessPhone}
              </a>
            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="background:#284735;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#a5c8ad;font-size:12px;">${businessName} · Reserva #${reserva.id}</p>
              <p style="margin:6px 0 0;color:#6a9470;font-size:11px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const enviarEmailConfirmacion = async (reserva) => {
  const transporter = crearTransporter();
  if (!transporter) {
    console.warn('Email no enviado: SMTP no configurado (falta SMTP_USER o SMTP_PASS en .env)');
    return { enviado: false, razon: 'SMTP no configurado' };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `${businessName} <${process.env.SMTP_USER}>`,
      to: reserva.email_huesped,
      subject: `✅ Reserva confirmada - ${reserva.hospedaje} | ${businessName}`,
      html: htmlEmailConfirmacion(reserva),
      attachments: [{
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo_naturalsound',
      }],
    });
    console.log(`Email de confirmación enviado a: ${reserva.email_huesped}`);
    return { enviado: true };
  } catch (error) {
    console.error('Error al enviar email:', error.message);
    return { enviado: false, razon: error.message };
  }
};

export const enviarWhatsAppMeta = async (reserva) => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'reserva_confirmada';
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || 'es';

  if (!token || !phoneId) {
    console.warn('WhatsApp Meta API no configurada (falta WHATSAPP_TOKEN o WHATSAPP_PHONE_ID en .env)');
    return { enviado: false, razon: 'Meta API no configurada' };
  }

  const telefono = reserva.telefono_huesped?.replace(/\D/g, '');
  if (!telefono) {
    return { enviado: false, razon: 'Sin número de teléfono' };
  }

  const parametros = [
    reserva.nombre_huesped,
    reserva.hospedaje,
    formatearFecha(reserva.check_in),
    formatearFecha(reserva.check_out),
    String(reserva.numero_huespedes),
    Number(reserva.total) > 0 ? formatearPrecio(reserva.total) : 'Sin saldo pendiente',
  ].map(texto => ({ type: 'text', text: String(texto) }));

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: telefono,
        type: 'template',
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [{ type: 'body', parameters: parametros }],
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Error Meta WhatsApp API:', JSON.stringify(data));
      return { enviado: false, razon: data.error?.message || 'Error desconocido' };
    }
    console.log(`WhatsApp Meta enviado a ${telefono}, messageId: ${data.messages?.[0]?.id}`);
    return { enviado: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    console.error('Error al enviar WhatsApp Meta:', error.message);
    return { enviado: false, razon: error.message };
  }
};

export const generarMensajeWhatsApp = (reserva) => {
  const lineas = [
    `🌿 *${businessName}*`,
    ``,
    `Hola *${reserva.nombre_huesped}*, ¡tu reserva está confirmada! ✅`,
    ``,
    `📋 *Detalles de tu reserva:*`,
    `🏕️ Alojamiento: *${reserva.hospedaje}*`,
    `📅 Check-in: *${formatearFecha(reserva.check_in)}*`,
    `📅 Check-out: *${formatearFecha(reserva.check_out)}*`,
    `👥 Huéspedes: *${reserva.numero_huespedes}*`,
  ];

  if (reserva.servicio_adicional && reserva.servicio_adicional !== 'N/A') {
    lineas.push(`✨ Servicio adicional: *${reserva.servicio_adicional}*`);
  }

  if (Number(reserva.total) > 0) {
    lineas.push(``, `💰 Saldo pendiente: *${formatearPrecio(reserva.total)}*`);
  }

  lineas.push(``, `¡Te esperamos! 🌿`);
  return encodeURIComponent(lineas.join('\n'));
};
