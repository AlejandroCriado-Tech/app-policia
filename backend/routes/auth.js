const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

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

module.exports = router;