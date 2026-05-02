const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/ia/extraer-preguntas — recibe PDF en base64 y devuelve preguntas
router.post('/extraer-preguntas', async (req, res) => {
  const { pdf_base64 } = req.body;

  if (!pdf_base64) {
    return res.status(400).json({ error: 'No se ha enviado ningún PDF' });
  }

  try {
    // Convertir base64 a buffer y extraer texto
    const buffer = Buffer.from(pdf_base64, 'base64');
    const pdfData = await pdfParse(buffer);
    const textoExtraido = pdfData.text;

    if (!textoExtraido || textoExtraido.trim().length < 50) {
      return res.status(400).json({ error: 'No se pudo extraer texto del PDF' });
    }

    // Llamar a Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Eres un asistente que extrae preguntas de examen de oposiciones de Policía Local.
    
Analiza el siguiente texto y extrae TODAS las preguntas tipo test que encuentres.
Devuelve ÚNICAMENTE un JSON válido con este formato exacto, sin texto adicional, sin markdown, sin bloques de código:

{
  "preguntas": [
    {
      "enunciado": "texto de la pregunta",
      "opcion_a": "primera opción",
      "opcion_b": "segunda opción", 
      "opcion_c": "tercera opción",
      "opcion_d": "cuarta opción o null si solo hay 3",
      "respuesta_correcta": "a, b, c o d",
      "explicacion": "breve explicación de por qué es correcta o null"
    }
  ]
}

Si una pregunta solo tiene 3 opciones, pon opcion_d como null.
Si no puedes determinar la respuesta correcta, pon "a" por defecto.

TEXTO DEL PDF:
${textoExtraido.substring(0, 15000)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Limpiar respuesta y parsear JSON
    const cleanJson = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanJson);

    res.json({ ok: true, preguntas: parsed.preguntas || [] });

  } catch (err) {
    console.error('Error en IA:', err);
    res.status(500).json({ error: 'Error al procesar el PDF con IA' });
  }
});

module.exports = router;