import express from 'express';
import nodemailer from 'nodemailer';
import { verificarToken } from './auth.js';

const router = express.Router();

const crearTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// Estado de configuración SMTP
router.get('/estado', verificarToken, async (req, res) => {
  const configurado = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  if (!configurado) {
    return res.json({ configurado: false, mensaje: 'SMTP no configurado' });
  }
  try {
    await crearTransporter().verify();
    res.json({ configurado: true, correo: process.env.SMTP_USER, mensaje: 'Conexión SMTP activa' });
  } catch (error) {
    res.json({ configurado: false, mensaje: error.message });
  }
});

// Enviar correo de prueba
router.post('/prueba', verificarToken, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Falta el correo destino' });
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(400).json({ error: 'SMTP no configurado' });
  }
  try {
    await crearTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: '✅ Prueba de correo - Natural Sound Glamping',
      html: `<p>Este es un correo de prueba enviado desde el panel de <strong>Natural Sound Glamping</strong>. La configuración de correo está funcionando correctamente.</p>`,
    });
    res.json({ enviado: true, mensaje: `Correo de prueba enviado a ${email}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
