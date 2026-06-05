const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    // Buscamos el usuario en la base de datos
    const [rows] = await db.query(
      'SELECT * FROM personas WHERE correo = ? AND activo = 1',
      [correo]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const persona = rows[0];

    // Verificamos la contraseña
    const passwordOk = await bcrypt.compare(contrasena, persona.contrasena_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Generamos el token JWT
    const token = jwt.sign(
      {
        id: persona.id_persona,
        nombre: persona.nombre,
        correo: persona.correo,
        rol: persona.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

  res.json({
    token,
    user: {
      id: persona.id_persona,
      nombre: persona.nombre,
      apellido1: persona.apellido1,
      correo: persona.correo,
      rol: persona.rol,
      foto: persona.foto || null,
      primer_login: persona.primer_login === 1
    }
  });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/auth/cambiar-contrasena
router.put('/cambiar-contrasena', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No autorizado' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  const { nuevaContrasena } = req.body;
  if (!nuevaContrasena || nuevaContrasena.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const hash = await bcrypt.hash(nuevaContrasena, 10);
    await db.query(
      'UPDATE personas SET contrasena_hash = ?, primer_login = 0 WHERE id_persona = ?',
      [hash, payload.id]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/recuperar-contrasena
router.post('/recuperar-contrasena', async (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ error: 'Correo requerido' });

  try {
    const [rows] = await db.query(
      'SELECT id_persona, nombre FROM personas WHERE correo = ? AND activo = 1',
      [correo]
    );

    // Siempre responder OK para no revelar si el correo existe
    if (rows.length === 0) return res.json({ ok: true });

    const persona = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await db.query(
      'INSERT INTO password_reset_tokens (id_persona, token, expires_at) VALUES (?, ?, ?)',
      [persona.id_persona, token, expira]
    );

    const enlace = `${process.env.APP_URL}/reset?token=${token}`;

    await transporter.sendMail({
      from: `"PoliTest Cáceres" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: 'Recuperación de contraseña - PoliTest Cáceres',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#1d4ed8">PoliTest Cáceres</h2>
          <p>Hola <strong>${persona.nombre}</strong>,</p>
          <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón para crear una nueva:</p>
          <a href="${enlace}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#1d4ed8;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
            Restablecer contraseña
          </a>
          <p style="color:#6b7280;font-size:13px">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este mensaje.</p>
        </div>
      `,
    });

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar el correo' });
  }
});

// POST /api/auth/reset-contrasena
router.post('/reset-contrasena', async (req, res) => {
  const { token, nuevaContrasena } = req.body;
  if (!token || !nuevaContrasena || nuevaContrasena.length < 6) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND usado = 0 AND expires_at > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'El enlace no es válido o ha expirado' });
    }

    const reset = rows[0];
    const hash = await bcrypt.hash(nuevaContrasena, 10);

    await db.query('UPDATE personas SET contrasena_hash = ? WHERE id_persona = ?', [hash, reset.id_persona]);
    await db.query('UPDATE password_reset_tokens SET usado = 1 WHERE id = ?', [reset.id]);

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;