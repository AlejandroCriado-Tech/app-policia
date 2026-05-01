const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/retos/:id_persona — obtiene retos, medallas y puntos totales del alumno
router.get('/:id_persona', async (req, res) => {
  const { id_persona } = req.params;

  try {
    // 1. Obtener todos los retos con el progreso del alumno
    const [retos] = await db.query(`
      SELECT 
        r.id_reto, r.nombre, r.descripcion, r.tipo, r.objetivo, r.puntos,
        COALESCE(ar.progreso, 0) AS progreso,
        COALESCE(ar.completado, 0) AS completado,
        ar.fecha_completado
      FROM retos r
      LEFT JOIN alumno_retos ar 
        ON r.id_reto = ar.id_reto AND ar.id_persona = ?
      WHERE r.activo = 1
    `, [id_persona]);

    // 2. Obtener todas las medallas con si el alumno las tiene
    const [medallas] = await db.query(`
      SELECT 
        m.id_medalla, m.nombre, m.descripcion, m.icono, m.color, m.id_reto,
        CASE WHEN am.id IS NOT NULL THEN 1 ELSE 0 END AS conseguida,
        am.fecha_obtenida
      FROM medallas m
      LEFT JOIN alumno_medallas am 
        ON m.id_medalla = am.id_medalla AND am.id_persona = ?
    `, [id_persona]);

    // 3. Puntos totales del alumno (suma de puntos de retos completados)
    const [puntosRes] = await db.query(`
      SELECT COALESCE(SUM(r.puntos), 0) AS puntos_totales
      FROM alumno_retos ar
      JOIN retos r ON ar.id_reto = r.id_reto
      WHERE ar.id_persona = ? AND ar.completado = 1
    `, [id_persona]);

    // 4. Ranking — todos los alumnos con sus puntos totales
    const [ranking] = await db.query(`
      SELECT 
        p.id_persona, p.nombre, p.apellido1,
        COALESCE(SUM(r.puntos), 0) AS puntos_totales
      FROM personas p
      LEFT JOIN alumno_retos ar ON p.id_persona = ar.id_persona AND ar.completado = 1
      LEFT JOIN retos r ON ar.id_reto = r.id_reto
      WHERE p.activo = 1 AND p.rol = 'alumno'
      GROUP BY p.id_persona
      ORDER BY puntos_totales DESC
      LIMIT 10
    `);

    res.json({
      retos,
      medallas,
      puntos_totales: puntosRes[0].puntos_totales,
      ranking
    });

  } catch (err) {
    console.error('Error en GET /api/retos:', err);
    res.status(500).json({ error: 'Error al obtener retos' });
  }
});

// POST /api/retos/progreso — actualiza el progreso de un alumno en un reto
router.post('/progreso', async (req, res) => {
  const { id_persona, tipo, valor } = req.body;
  // tipo: 'tests_completados' | 'nota_test' | 'dias_seguidos'
  // valor: número (ej: 1 test más, o la nota obtenida, o días seguidos)

  try {
    // Buscar retos activos de ese tipo
    const [retos] = await db.query(
      `SELECT * FROM retos WHERE tipo = ? AND activo = 1`,
      [tipo]
    );

    for (const reto of retos) {
      // Obtener o crear registro de progreso
      const [existing] = await db.query(
        `SELECT * FROM alumno_retos WHERE id_persona = ? AND id_reto = ?`,
        [id_persona, reto.id_reto]
      );

      if (existing.length === 0) {
        // Crear registro nuevo
        await db.query(
          `INSERT INTO alumno_retos (id_persona, id_reto, progreso) VALUES (?, ?, ?)`,
          [id_persona, reto.id_reto, tipo === 'nota_test' ? valor : 1]
        );
      } else if (!existing[0].completado) {
        // Actualizar progreso
        let nuevoProgreso;
        if (tipo === 'nota_test') {
          nuevoProgreso = Math.max(existing[0].progreso, valor); // guardar la mejor nota
        } else {
          nuevoProgreso = existing[0].progreso + valor;
        }

        const completado = nuevoProgreso >= reto.objetivo ? 1 : 0;
        const fechaCompletado = completado ? new Date().toISOString().split('T')[0] : null;

        await db.query(
          `UPDATE alumno_retos 
           SET progreso = ?, completado = ?, fecha_completado = ?
           WHERE id_persona = ? AND id_reto = ?`,
          [nuevoProgreso, completado, fechaCompletado, id_persona, reto.id_reto]
        );

        // Si se completó, asignar medalla
        if (completado) {
          const [medalla] = await db.query(
            `SELECT * FROM medallas WHERE id_reto = ?`,
            [reto.id_reto]
          );
          if (medalla.length > 0) {
            await db.query(
              `INSERT IGNORE INTO alumno_medallas (id_persona, id_medalla, fecha_obtenida)
               VALUES (?, ?, ?)`,
              [id_persona, medalla[0].id_medalla, fechaCompletado]
            );
          }
        }
      }
    }

    res.json({ ok: true });

  } catch (err) {
    console.error('Error en POST /api/retos/progreso:', err);
    res.status(500).json({ error: 'Error al actualizar progreso' });
  }
});

module.exports = router;