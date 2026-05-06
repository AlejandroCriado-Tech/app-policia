const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/preguntas/temas — estructura de bloques y temas
router.get('/temas', (req, res) => {
  const temas = [
    { id_bloque: 1, nombre_bloque: "Derecho Constitucional", temas: [
      { id_tema: 1, nombre: "La Constitución Española" },
      { id_tema: 2, nombre: "La Monarquía Parlamentaria" },
      { id_tema: 3, nombre: "El Gobierno y la Administración" },
      { id_tema: 4, nombre: "Órganos de Gobierno" },
    ]},
    { id_bloque: 2, nombre_bloque: "Organización territorial, Poder Judicial y Derecho Administrativo", temas: [
      { id_tema: 1, nombre: "Organización territorial en la Administración General del Estado" },
      { id_tema: 2, nombre: "La organización territorial del Estado" },
      { id_tema: 3, nombre: "El Poder Judicial" },
      { id_tema: 4, nombre: "Fuentes del Derecho Administrativo" },
      { id_tema: 5, nombre: "El acto administrativo" },
    ]},
    { id_bloque: 3, nombre_bloque: "Procedimiento administrativo, recursos y régimen local", temas: [
      { id_tema: 1, nombre: "El procedimiento administrativo" },
      { id_tema: 2, nombre: "Revisión de los actos administrativos. Los recursos administrativos" },
      { id_tema: 3, nombre: "El régimen local español" },
      { id_tema: 4, nombre: "La organización municipal" },
      { id_tema: 5, nombre: "La provincia" },
      { id_tema: 6, nombre: "Otras entidades locales" },
    ]},
    { id_bloque: 4, nombre_bloque: "Función pública local, gestión administrativa y haciendas locales", temas: [
      { id_tema: 1, nombre: "La función pública local" },
      { id_tema: 2, nombre: "Derechos y deberes de los funcionarios de las entidades locales" },
      { id_tema: 3, nombre: "Formas de acción administrativa" },
      { id_tema: 4, nombre: "Ordenanzas, reglamentos y bandos" },
    ]},
    { id_bloque: 5, nombre_bloque: "Normativa sobre Cuerpos y Fuerzas de Seguridad", temas: [
      { id_tema: 1, nombre: "Normativa sobre los Cuerpos y Fuerzas de Seguridad" },
      { id_tema: 2, nombre: "Las relaciones entre la policía y la sociedad" },
      { id_tema: 3, nombre: "La seguridad. Concepto" },
      { id_tema: 4, nombre: "De la denuncia. De la querella. De la inspección ocular..." },
      { id_tema: 5, nombre: "Ley Orgánica 4/2015, de 30 de marzo de Protección de la Seguridad Ciudadana" },
      { id_tema: 6, nombre: "Ley Orgánica 1/2004, de 28 de diciembre, de Medidas de Protección Integral contra la Violencia de Género" },
      { id_tema: 7, nombre: "La Policía Judicial" },
    ]},
    { id_bloque: 6, nombre_bloque: "Derecho Penal", temas: [
      { id_tema: 1, nombre: "Consideraciones generales sobre Derecho Penal" },
      { id_tema: 2, nombre: "Delitos de homicidio. Delitos contra la libertad e indemnidad moral..." },
      { id_tema: 3, nombre: "Delitos contra el patrimonio. Delitos contra los derechos de los ciudadanos extranjeros..." },
      { id_tema: 4, nombre: "Delitos contra la Administración Pública y contra la Administración de Justicia" },
      { id_tema: 5, nombre: "Delitos contra la seguridad vial. Especial referencia a su reforma por L.O. 15/2007" },
      { id_tema: 6, nombre: "Ley Orgánica 5/2000, de 12 de enero, Reguladora de la Responsabilidad Penal de los Menores" },
    ]},
    { id_bloque: 7, nombre_bloque: "Legislación de tráfico", temas: [
      { id_tema: 1, nombre: "Tráfico, circulación y seguridad vial" },
      { id_tema: 2, nombre: "Otras normas de circulación" },
      { id_tema: 3, nombre: "Las autorizaciones administrativas. Permisos y licencias de conducción" },
      { id_tema: 4, nombre: "Régimen sancionador en materia de tráfico" },
      { id_tema: 5, nombre: "Accidentes de tráfico" },
      { id_tema: 6, nombre: "Normas generales sobre señales" },
    ]},
  ];
  res.json(temas);
});

// GET /api/preguntas/simulacro?limit=100 — preguntas aleatorias de todos los bloques
router.get('/simulacro', async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  try {
    const [rows] = await db.query(
      `SELECT id_pregunta, id_bloque, nombre_bloque, id_tema, nombre_tema,
              enunciado, opcion_a, opcion_b, opcion_c, opcion_d
       FROM preguntas
       WHERE activa = 1
       ORDER BY RAND()
       LIMIT ?`,
      [limit]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No hay preguntas disponibles para el simulacro' });
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener preguntas del simulacro' });
  }
});

// GET /api/preguntas/corregir/:id_pregunta — respuesta correcta de una pregunta
router.get('/corregir/:id_pregunta', async (req, res) => {
  const { id_pregunta } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT respuesta_correcta, explicacion FROM preguntas WHERE id_pregunta = ?`,
      [id_pregunta]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Pregunta no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al corregir' });
  }
});

// GET /api/preguntas/:id_bloque/:id_tema — preguntas de un tema
router.get('/:id_bloque/:id_tema', async (req, res) => {
  const { id_bloque, id_tema } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit) : 20;

  try {
    const [rows] = await db.query(
      `SELECT id_pregunta, enunciado, opcion_a, opcion_b, opcion_c, opcion_d
       FROM preguntas
       WHERE id_bloque = ? AND id_tema = ? AND activa = 1
       ORDER BY RAND()
       LIMIT ?`,
      [id_bloque, id_tema, limit]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener preguntas' });
  }
});

// POST /api/preguntas — crear pregunta manualmente (solo admin/profesor)
router.post('/', async (req, res) => {
  const { id_bloque, nombre_bloque, id_tema, nombre_tema, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO preguntas (id_bloque, nombre_bloque, id_tema, nombre_tema, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_bloque, nombre_bloque, id_tema, nombre_tema, enunciado, opcion_a, opcion_b, opcion_c, opcion_d || null, respuesta_correcta, explicacion || null]
    );
    res.status(201).json({ ok: true, id_pregunta: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear pregunta' });
  }
});

// POST /api/preguntas/resultado — guardar resultado de un test
router.post('/resultado', async (req, res) => {
  const { id_persona, id_bloque, id_tema, total_preguntas, correctas, incorrectas, nota, tiempo_segundos, es_simulacro } = req.body;
  try {
    await db.query(
      `INSERT INTO resultados_test (id_persona, id_bloque, id_tema, total_preguntas, correctas, incorrectas, nota, tiempo_segundos, es_simulacro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_persona, id_bloque, id_tema, total_preguntas, correctas, incorrectas, nota, tiempo_segundos, es_simulacro || 0]
    );

    // Actualizar progreso en retos automáticamente
    await fetch('http://localhost:3001/api/retos/progreso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_persona, tipo: 'tests_completados', valor: 1 })
    });

    if (nota >= 9) {
      await fetch('http://localhost:3001/api/retos/progreso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_persona, tipo: 'nota_test', valor: Math.round(nota * 10) })
      });
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar resultado' });
  }
});

module.exports = router;
