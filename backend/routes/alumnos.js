const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// POST /api/alumnos/registrar
router.post('/registrar', async (req, res) => {
  const { nombre, apellido1, correo, contrasena, foto } = req.body;

  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Verificar si el correo ya existe
    const [existe] = await db.query(
      'SELECT id_persona FROM personas WHERE correo = ?',
      [correo]
    );
    if (existe.length > 0) {
      return res.status(409).json({ error: 'Ya existe un alumno con ese correo' });
    }

    // Hashear la contraseña
    const contrasena_hash = await bcrypt.hash(contrasena, 10);

    // Generar usuario a partir del correo
    const usuario = correo.split('@')[0];

    // Insertar en la BD
    const [result] = await db.query(
      `INSERT INTO personas (nombre, apellido1, dni, usuario, correo, contrasena_hash, rol, foto, activo)
       VALUES (?, ?, ?, ?, ?, ?, 'alumno', ?, 1)`,
      [nombre, apellido1 || '', '00000000X', usuario, correo, contrasena_hash, foto || null]
    );

    res.status(201).json({
      ok: true,
      mensaje: 'Alumno registrado correctamente',
      id: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;