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
    foto: persona.foto || null
  }
});

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;