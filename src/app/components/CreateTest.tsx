import { useState, useRef } from 'react';
import { PlusCircle, Trash2, Save, FileText, UploadCloud, Wand2, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const TEMAS = [
  { id_bloque: 1, nombre_bloque: "Bloque 1. Derecho Constitucional", temas: [
    { id_tema: 1, nombre: "La Constitución Española" },
    { id_tema: 2, nombre: "La Monarquía Parlamentaria" },
    { id_tema: 3, nombre: "El Gobierno y la Administración" },
    { id_tema: 4, nombre: "Órganos de Gobierno" },
  ]},
  { id_bloque: 2, nombre_bloque: "Bloque 2. Organización territorial, Poder Judicial y Derecho Administrativo", temas: [
    { id_tema: 1, nombre: "Organización territorial en la Administración General del Estado" },
    { id_tema: 2, nombre: "La organización territorial del Estado" },
    { id_tema: 3, nombre: "El Poder Judicial" },
    { id_tema: 4, nombre: "Fuentes del Derecho Administrativo" },
    { id_tema: 5, nombre: "El acto administrativo" },
  ]},
  { id_bloque: 3, nombre_bloque: "Bloque 3. Procedimiento administrativo, recursos y régimen local", temas: [
    { id_tema: 1, nombre: "El procedimiento administrativo" },
    { id_tema: 2, nombre: "Revisión de los actos administrativos. Los recursos administrativos" },
    { id_tema: 3, nombre: "El régimen local español" },
    { id_tema: 4, nombre: "La organización municipal" },
    { id_tema: 5, nombre: "La provincia" },
    { id_tema: 6, nombre: "Otras entidades locales" },
  ]},
  { id_bloque: 4, nombre_bloque: "Bloque 4. Función pública local, gestión administrativa y haciendas locales", temas: [
    { id_tema: 1, nombre: "La función pública local" },
    { id_tema: 2, nombre: "Derechos y deberes de los funcionarios de las entidades locales" },
    { id_tema: 3, nombre: "Formas de acción administrativa" },
    { id_tema: 4, nombre: "Ordenanzas, reglamentos y bandos" },
  ]},
  { id_bloque: 5, nombre_bloque: "Bloque 5. Normativa sobre Cuerpos y Fuerzas de Seguridad", temas: [
    { id_tema: 1, nombre: "Normativa sobre los Cuerpos y Fuerzas de Seguridad" },
    { id_tema: 2, nombre: "Las relaciones entre la policía y la sociedad" },
    { id_tema: 3, nombre: "La seguridad. Concepto" },
    { id_tema: 4, nombre: "De la denuncia. De la querella. De la inspección ocular..." },
    { id_tema: 5, nombre: "Ley Orgánica 4/2015, de 30 de marzo de Protección de la Seguridad Ciudadana" },
    { id_tema: 6, nombre: "Ley Orgánica 1/2004, de 28 de diciembre, de Medidas de Protección Integral contra la Violencia de Género" },
    { id_tema: 7, nombre: "La Policía Judicial" },
  ]},
  { id_bloque: 6, nombre_bloque: "Bloque 6. Derecho Penal", temas: [
    { id_tema: 1, nombre: "Consideraciones generales sobre Derecho Penal" },
    { id_tema: 2, nombre: "Delitos de homicidio. Delitos contra la libertad e indemnidad moral..." },
    { id_tema: 3, nombre: "Delitos contra el patrimonio. Delitos contra los derechos de los ciudadanos extranjeros..." },
    { id_tema: 4, nombre: "Delitos contra la Administración Pública y contra la Administración de Justicia" },
    { id_tema: 5, nombre: "Delitos contra la seguridad vial. Especial referencia a su reforma por L.O. 15/2007" },
    { id_tema: 6, nombre: "Ley Orgánica 5/2000, de 12 de enero, Reguladora de la Responsabilidad Penal de los Menores" },
  ]},
  { id_bloque: 7, nombre_bloque: "Bloque 7. Legislación de tráfico", temas: [
    { id_tema: 1, nombre: "Tráfico, circulación y seguridad vial" },
    { id_tema: 2, nombre: "Otras normas de circulación" },
    { id_tema: 3, nombre: "Las autorizaciones administrativas. Permisos y licencias de conducción" },
    { id_tema: 4, nombre: "Régimen sancionador en materia de tráfico" },
    { id_tema: 5, nombre: "Accidentes de tráfico" },
    { id_tema: 6, nombre: "Normas generales sobre señales" },
  ]},
];

interface Question {
  enunciado: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  opcion_d: string;
  respuesta_correcta: 'a' | 'b' | 'c' | 'd';
  explicacion: string;
}

const emptyQuestion = (): Question => ({
  enunciado: '',
  opcion_a: '',
  opcion_b: '',
  opcion_c: '',
  opcion_d: '',
  respuesta_correcta: 'a',
  explicacion: '',
});

export function CreateTest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedBloque, setSelectedBloque] = useState<number | null>(null);
  const [selectedTema, setSelectedTema] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const bloqueActual = TEMAS.find(b => b.id_bloque === selectedBloque);
  const temaActual = bloqueActual?.temas.find(t => t.id_tema === selectedTema);

  // ── Handlers de preguntas ──────────────────────────────────────
  const handleAddQuestion = () => {
    setQuestions([...questions, emptyQuestion()]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) { toast.error('El test debe tener al menos una pregunta'); return; }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionField = (index: number, field: keyof Question, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  // ── PDF & IA ───────────────────────────────────────────────────
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') { toast.error('Por favor, sube un archivo PDF'); return; }

    setIsImporting(true);
    try {
      // Convertir PDF a base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('http://localhost:3001/api/ia/extraer-preguntas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_base64: base64 }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al procesar el PDF');

      setQuestions(data.preguntas.map((p: Question) => ({
        enunciado: p.enunciado || '',
        opcion_a: p.opcion_a || '',
        opcion_b: p.opcion_b || '',
        opcion_c: p.opcion_c || '',
        opcion_d: p.opcion_d || '',
        respuesta_correcta: p.respuesta_correcta || 'a',
        explicacion: p.explicacion || '',
      })));

      toast.success(`¡Se han extraído ${data.preguntas.length} preguntas del PDF!`);
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el PDF');
    } finally {
      setIsImporting(false);
    }
  };

  // ── Guardar ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedBloque || !selectedTema) { toast.error('Selecciona un bloque y un tema'); return; }

    const isValid = questions.every(q =>
      q.enunciado.trim() && q.opcion_a.trim() && q.opcion_b.trim() && q.opcion_c.trim()
    );
    if (!isValid) { toast.error('Rellena el enunciado y al menos las opciones A, B y C de cada pregunta'); return; }

    setIsSaving(true);
    try {
      let errores = 0;
      for (const q of questions) {
        const res = await fetch('http://localhost:3001/api/preguntas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_bloque: selectedBloque,
            nombre_bloque: bloqueActual?.nombre_bloque,
            id_tema: selectedTema,
            nombre_tema: temaActual?.nombre,
            enunciado: q.enunciado,
            opcion_a: q.opcion_a,
            opcion_b: q.opcion_b,
            opcion_c: q.opcion_c,
            opcion_d: q.opcion_d || null,
            respuesta_correcta: q.respuesta_correcta,
            explicacion: q.explicacion || null,
          }),
        });
        if (!res.ok) errores++;
      }

      if (errores > 0) {
        toast.error(`${errores} preguntas no se pudieron guardar`);
      } else {
        toast.success(`¡${questions.length} preguntas guardadas correctamente!`);
        setTimeout(() => navigate('/tests'), 1500);
      }
    } catch (err) {
      toast.error('Error al guardar las preguntas');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Crear Nuevo Test</h2>
        <p className="text-gray-500">Añade preguntas para los alumnos por bloque y tema</p>
      </div>

      {/* Selector de bloque y tema */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" /> Bloque y Tema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bloque</label>
            <div className="relative">
              <select
                value={selectedBloque ?? ''}
                onChange={e => { setSelectedBloque(Number(e.target.value)); setSelectedTema(null); }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Selecciona un bloque...</option>
                {TEMAS.map(b => (
                  <option key={b.id_bloque} value={b.id_bloque}>{b.nombre_bloque}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
            <div className="relative">
              <select
                value={selectedTema ?? ''}
                onChange={e => setSelectedTema(Number(e.target.value))}
                disabled={!selectedBloque}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50"
              >
                <option value="">Selecciona un tema...</option>
                {bloqueActual?.temas.map(t => (
                  <option key={t.id_tema} value={t.id_tema}>{t.nombre}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* IA Import PDF */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-1">
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Wand2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-900">Importar con Inteligencia Artificial</h3>
              <p className="text-sm text-indigo-700">Sube un PDF con exámenes y extraemos las preguntas automáticamente.</p>
            </div>
          </div>

          <div
            className={`mt-4 border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-indigo-200 bg-white hover:border-indigo-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            {isImporting ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <div>
                  <p className="text-indigo-900 font-medium">La IA está analizando el documento...</p>
                  <p className="text-indigo-600 text-sm">Extrayendo preguntas y detectando respuestas correctas</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <UploadCloud className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <p className="text-indigo-900 font-medium mb-1">Arrastra tu PDF aquí o haz clic para subirlo</p>
                  <p className="text-indigo-500 text-sm">Formato .PDF (Máx. 10MB)</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Seleccionar PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preguntas */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Preguntas</h3>
          <span className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Total: {questions.length}
          </span>
        </div>

        {questions.map((q, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative group">
            <button
              onClick={() => handleRemoveQuestion(i)}
              className="absolute top-4 right-4 p-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <div className="mb-4 pr-12">
              <label className="block text-sm font-medium text-gray-900 mb-2">Pregunta {i + 1}</label>
              <textarea
                value={q.enunciado}
                onChange={e => handleQuestionField(i, 'enunciado', e.target.value)}
                placeholder="Escribe el enunciado de la pregunta..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none h-20"
              />
            </div>

            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-gray-700">Opciones (marca la correcta)</label>
              {(['a', 'b', 'c', 'd'] as const).map((letra, optIndex) => (
                <div
                  key={letra}
                  className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                    q.respuesta_correcta === letra ? 'border-green-400 bg-green-50' : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`correct-${i}`}
                    checked={q.respuesta_correcta === letra}
                    onChange={() => handleQuestionField(i, 'respuesta_correcta', letra)}
                    className="w-5 h-5 text-green-600 ml-2 cursor-pointer"
                  />
                  <span className={`font-bold w-6 text-center ${q.respuesta_correcta === letra ? 'text-green-700' : 'text-gray-400'}`}>
                    {letra.toUpperCase()}
                  </span>
                  <input
                    type="text"
                    value={q[`opcion_${letra}` as keyof Question] as string}
                    onChange={e => handleQuestionField(i, `opcion_${letra}` as keyof Question, e.target.value)}
                    placeholder={`Opción ${letra.toUpperCase()}${optIndex === 3 ? ' (opcional)' : ''}`}
                    className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                      q.respuesta_correcta === letra ? 'border-green-200 bg-white text-green-900' : 'border-gray-200 bg-white'
                    }`}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Explicación (opcional)</label>
              <input
                type="text"
                value={q.explicacion}
                onChange={e => handleQuestionField(i, 'explicacion', e.target.value)}
                placeholder="¿Por qué es correcta esta respuesta?"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-gray-50/90 backdrop-blur-md p-4 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
        <button
          onClick={handleAddQuestion}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium"
        >
          <PlusCircle className="w-5 h-5" /> Añadir Pregunta Manual
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors font-bold disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? 'Guardando...' : 'Guardar y Publicar'}
        </button>
      </div>
    </div>
  );
}