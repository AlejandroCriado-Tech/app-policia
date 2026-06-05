import { useState, useRef, useEffect } from 'react';
import { PlusCircle, Trash2, Save, FileText, UploadCloud, Wand2, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../lib/api';

type BloqueOption = { id_bloque: number; nombre_bloque: string; temas: { id_tema: number; nombre: string }[] };

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

  const [bloques, setBloques] = useState<BloqueOption[]>([]);
  const [selectedBloque, setSelectedBloque] = useState<number | null>(null);
  const [selectedTema, setSelectedTema] = useState<number | null>(null);
  const [nextNumeroTest, setNextNumeroTest] = useState<number>(1);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/preguntas/temas`)
      .then(r => r.json())
      .then(setBloques)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedBloque === null || selectedBloque === 0 || !selectedTema) {
      setNextNumeroTest(1);
      return;
    }
    fetch(`${API_URL}/api/preguntas/versiones/${selectedBloque}/${selectedTema}`)
      .then(r => r.json())
      .then((data: { numero_test: number }[]) => {
        const max = data.length > 0 ? Math.max(...data.map(d => d.numero_test)) : 0;
        setNextNumeroTest(max + 1);
      })
      .catch(() => setNextNumeroTest(1));
  }, [selectedBloque, selectedTema]);

  const esSimulacro = selectedBloque === 0;
  const bloqueActual = bloques.find(b => b.id_bloque === selectedBloque);
  const temaActual = bloqueActual?.temas.find(t => t.id_tema === selectedTema);

  const handleAddQuestion = () => setQuestions([...questions, emptyQuestion()]);

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) { toast.error('El test debe tener al menos una pregunta'); return; }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionField = (index: number, field: keyof Question, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

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
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${API_URL}/api/ia/extraer-preguntas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_base64: base64 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el PDF');

      if (!data.preguntas || data.preguntas.length === 0) {
        toast.error('No se encontraron preguntas en el PDF. ¿Tiene formato de test?');
        return;
      }

      setQuestions(data.preguntas.map((p: Question) => ({
        enunciado: p.enunciado || '',
        opcion_a: p.opcion_a || '',
        opcion_b: p.opcion_b || '',
        opcion_c: p.opcion_c || '',
        opcion_d: p.opcion_d || '',
        respuesta_correcta: (['a','b','c','d'].includes(p.respuesta_correcta) ? p.respuesta_correcta : 'a') as 'a'|'b'|'c'|'d',
        explicacion: p.explicacion || '',
      })));

      toast.success(`¡Se han extraído ${data.preguntas.length} preguntas del PDF!`);

    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el PDF');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = async () => {
    // Validación: si no es simulacro, necesita bloque Y tema
    if (selectedBloque === null || (!esSimulacro && !selectedTema)) {
      toast.error('Selecciona un bloque y un tema');
      return;
    }

    const isValid = questions.every(q => q.enunciado.trim() && q.opcion_a.trim() && q.opcion_b.trim() && q.opcion_c.trim());
    if (!isValid) { toast.error('Rellena el enunciado y al menos las opciones A, B y C de cada pregunta'); return; }

    setIsSaving(true);
    try {
      let errores = 0;
      for (const q of questions) {
        const res = await fetch(`${API_URL}/api/preguntas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_bloque: esSimulacro ? 0 : selectedBloque,
            nombre_bloque: esSimulacro ? 'Simulacro' : bloqueActual?.nombre_bloque,
            id_tema: esSimulacro ? 0 : selectedTema,
            nombre_tema: esSimulacro ? 'Simulacro' : temaActual?.nombre,
            enunciado: q.enunciado,
            opcion_a: q.opcion_a,
            opcion_b: q.opcion_b,
            opcion_c: q.opcion_c,
            opcion_d: q.opcion_d || null,
            respuesta_correcta: q.respuesta_correcta,
            explicacion: q.explicacion || null,
            numero_test: esSimulacro ? 1 : nextNumeroTest,
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Crear Nuevo Test</h2>
        <p className="text-gray-500 dark:text-gray-400">Añade preguntas para los alumnos por bloque y tema</p>
      </div>

      {/* Selector de bloque y tema */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" /> Bloque y Tema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bloque</label>
            <div className="relative">
              <select
                value={selectedBloque ?? ''}
                onChange={e => {
                  const val = Number(e.target.value);
                  setSelectedBloque(val);
                  // Si es SIMULACRO (0), auto-asigna tema 0 y deshabilita selector
                  setSelectedTema(val === 0 ? 0 : null);
                }}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Selecciona un bloque...</option>
                <option value="0">🏆 SIMULACRO</option>
                {bloques.map(b => (
                  <option key={b.id_bloque} value={b.id_bloque}>{b.nombre_bloque}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tema</label>
            <div className="relative">
              {esSimulacro ? (
                // Cuando es simulacro, mostramos un campo deshabilitado informativo
                <div className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  🏆 Simulacro (todos los bloques)
                </div>
              ) : (
                <>
                  <select
                    value={selectedTema ?? ''}
                    onChange={e => setSelectedTema(Number(e.target.value))}
                    disabled={!selectedBloque}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50"
                  >
                    <option value="">Selecciona un tema...</option>
                    {bloqueActual?.temas.map(t => (
                      <option key={t.id_tema} value={t.id_tema}>{t.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Badge informativo cuando es simulacro */}
        {esSimulacro && (
          <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
            <span>🏆</span>
            <span>Las preguntas de simulacro se guardan con <strong>id_bloque=0</strong> y aparecerán disponibles en el apartado Simulacro.</span>
          </div>
        )}
        {/* Badge número de test cuando hay tema seleccionado */}
        {!esSimulacro && selectedBloque !== null && selectedTema !== null && (
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
            <span>📋</span>
            <span>Este test se guardará como <strong>Test {nextNumeroTest}</strong> del tema seleccionado.</span>
          </div>
        )}
      </div>

      {/* IA Import PDF */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-xl border border-indigo-100 dark:border-indigo-800 p-1">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-6 border border-white dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">
              <Wand2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300">Importar con Inteligencia Artificial</h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-400">Sube un PDF con exámenes y extraemos las preguntas automáticamente.</p>
            </div>
          </div>

          <div
            className={`mt-4 border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-700/50 hover:border-indigo-300 dark:hover:border-indigo-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            {isImporting ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
                <div>
                  <p className="text-indigo-900 dark:text-indigo-300 font-medium">La IA está analizando el documento...</p>
                  <p className="text-indigo-600 dark:text-indigo-400 text-sm">Extrayendo preguntas y detectando respuestas correctas</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                  <UploadCloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-indigo-900 dark:text-indigo-300 font-medium mb-1">Arrastra tu PDF aquí o haz clic para subirlo</p>
                  <p className="text-indigo-500 dark:text-indigo-400 text-sm">Formato .PDF (Máx. 10MB)</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
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
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Preguntas</h3>
          <span className="text-sm text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Total: {questions.length}
          </span>
        </div>

        {questions.map((q, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative group">
            <button
              onClick={() => handleRemoveQuestion(i)}
              className="absolute top-4 right-4 p-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <div className="mb-4 pr-12">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Pregunta {i + 1}</label>
              <textarea
                value={q.enunciado}
                onChange={e => handleQuestionField(i, 'enunciado', e.target.value)}
                placeholder="Escribe el enunciado de la pregunta..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 resize-none h-20"
              />
            </div>

            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Opciones (marca la correcta)</label>
              {(['a', 'b', 'c', 'd'] as const).map((letra, optIndex) => (
                <div
                  key={letra}
                  className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                    q.respuesta_correcta === letra
                      ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`correct-${i}`}
                    checked={q.respuesta_correcta === letra}
                    onChange={() => handleQuestionField(i, 'respuesta_correcta', letra)}
                    className="w-5 h-5 text-green-600 ml-2 cursor-pointer"
                  />
                  <span className={`font-bold w-6 text-center ${q.respuesta_correcta === letra ? 'text-green-700 dark:text-green-400' : 'text-gray-400'}`}>
                    {letra.toUpperCase()}
                  </span>
                  <input
                    type="text"
                    value={q[`opcion_${letra}` as keyof Question] as string}
                    onChange={e => handleQuestionField(i, `opcion_${letra}` as keyof Question, e.target.value)}
                    placeholder={`Opción ${letra.toUpperCase()}${optIndex === 3 ? ' (opcional)' : ''}`}
                    className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400 ${
                      q.respuesta_correcta === letra
                        ? 'border-green-200 dark:border-green-700 bg-white dark:bg-gray-700 text-green-900 dark:text-green-300'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }`}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explicación (opcional)</label>
              <input
                type="text"
                value={q.explicacion}
                onChange={e => handleQuestionField(i, 'explicacion', e.target.value)}
                placeholder="¿Por qué es correcta esta respuesta?"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-md p-4 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
        <button
          onClick={handleAddQuestion}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
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