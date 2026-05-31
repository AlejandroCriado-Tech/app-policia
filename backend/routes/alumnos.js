const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// POST /api/alumnos/registrar
router.post('/registrar', async (req, res) => {
  const { nombre, apellido1, dni, correo, contrasena, foto } = req.body;

  if (!nombre || !correo || !contrasena || !dni) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const dniRegex = /^[0-9]{8}[A-Z]$/;
  if (!dniRegex.test(dni.toUpperCase())) {
    return res.status(400).json({ error: 'El formato del DNI no es válido' });
  }

  try {
    const [existe] = await db.query(
      'SELECT id_persona FROM personas WHERE correo = ? OR dni = ?',
      [correo, dni.toUpperCase()]
    );
    if (existe.length > 0) {
      return res.status(409).json({ error: 'Ya existe un alumno con ese correo o DNI' });
    }

    const contrasena_hash = await bcrypt.hash(contrasena, 10);
    const usuario = correo.split('@')[0];

    const [result] = await db.query(
      `INSERT INTO personas (nombre, apellido1, dni, usuario, correo, contrasena_hash, rol, foto, activo)
       VALUES (?, ?, ?, ?, ?, ?, 'alumno', ?, 1)`,
      [nombre, apellido1 || '', dni.toUpperCase(), usuario, correo, contrasena_hash, foto || null]
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

// GET /api/alumnos — lista de alumnos con estadísticas
router.get('/', async (req, res) => {
  try {
    const [alumnos] = await db.query(
      `SELECT 
        p.id_persona,
        p.nombre,
        p.apellido1,
        p.apellido2,
        p.correo,
        p.dni,
        p.telefono,
        p.activo,
        p.fecha_registro,
        p.foto,
        COUNT(rt.id_resultado_test) as tests_completados,
        ROUND(AVG(rt.nota), 2) as nota_media,
        MAX(rt.fecha) as ultimo_acceso
       FROM personas p
       LEFT JOIN resultados_test rt ON rt.id_persona = p.id_persona
       WHERE p.rol = 'alumno'
       GROUP BY p.id_persona
       ORDER BY p.nombre ASC`
    );
    res.json(alumnos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener alumnos' });
  }
});

// PATCH /api/alumnos/:id/activo — activar/desactivar alumno
router.patch('/:id/activo', async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;
  try {
    await db.query(
      'UPDATE personas SET activo = ? WHERE id_persona = ? AND rol = "alumno"',
      [activo ? 1 : 0, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar alumno' });
  }
});

module.exports = router;
