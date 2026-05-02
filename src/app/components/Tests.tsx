import { useState, useEffect, useCallback } from "react";
import {
  CheckSquare, Clock, BarChart2, Zap, AlertCircle, PlayCircle,
  CheckCircle2, XCircle, ArrowRight, RotateCcw, PlusCircle,
  ChevronRight, Loader2, BookOpen
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const COLORES_BLOQUE = [
  { bg: "bg-blue-100",   text: "text-blue-600"   },
  { bg: "bg-indigo-100", text: "text-indigo-600" },
  { bg: "bg-purple-100", text: "text-purple-600" },
  { bg: "bg-pink-100",   text: "text-pink-600"   },
  { bg: "bg-orange-100", text: "text-orange-600" },
  { bg: "bg-green-100",  text: "text-green-600"  },
  { bg: "bg-cyan-100",   text: "text-cyan-600"   },
];

type Pregunta = {
  id_pregunta: number;
  enunciado: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  opcion_d: string | null;
};

type Bloque = {
  id_bloque: number;
  nombre_bloque: string;
  temas: { id_tema: number; nombre: string }[];
};

type TestActivo = {
  id_bloque: number;
  id_tema: number;
  nombre_bloque: string;
  nombre_tema: string;
  preguntas: Pregunta[];
};

export function Tests() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Estado del dashboard ───────────────────────────────────────
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [loadingBloques, setLoadingBloques] = useState(true);
  const [bloqueAbierto, setBloqueAbierto] = useState<number | null>(null);

  // ── Estado del test activo ─────────────────────────────────────
  const [testActivo, setTestActivo] = useState<TestActivo | null>(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'a'|'b'|'c'|'d' | null>(null);
  const [correccion, setCorreccion] = useState<{ respuesta_correcta: string; explicacion: string | null } | null>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [testFinished, setTestFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [timeUsed, setTimeUsed] = useState(0);

  // ── Cargar bloques ─────────────────────────────────────────────
  useEffect(() => {
    fetch('http://localhost:3001/api/preguntas/temas')
      .then(r => r.json())
      .then(setBloques)
      .catch(() => toast.error('Error cargando temario'))
      .finally(() => setLoadingBloques(false));
  }, []);

  // ── Timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!testActivo || testFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setTestFinished(true); return 0; }
        return prev - 1;
      });
      setTimeUsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [testActivo, testFinished]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m.toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;
  };

  // ── Iniciar test ───────────────────────────────────────────────
  const iniciarTest = async (bloque: Bloque, tema: { id_tema: number; nombre: string }) => {
    setLoadingTest(true);
    try {
      const res = await fetch(`http://localhost:3001/api/preguntas/${bloque.id_bloque}/${tema.id_tema}?limit=20`);
      const preguntas: Pregunta[] = await res.json();

      if (!preguntas.length) {
        toast.error('Este tema aún no tiene preguntas. El profesor debe añadirlas.');
        return;
      }

      setTestActivo({
        id_bloque: bloque.id_bloque,
        id_tema: tema.id_tema,
        nombre_bloque: bloque.nombre_bloque,
        nombre_tema: tema.nombre,
        preguntas,
      });
      setCurrentIdx(0);
      setSelectedOption(null);
      setCorreccion(null);
      setScore({ correct: 0, incorrect: 0 });
      setTestFinished(false);
      setTimeLeft(45 * 60);
      setTimeUsed(0);
    } catch {
      toast.error('Error al cargar las preguntas');
    } finally {
      setLoadingTest(false);
    }
  };

  // ── Corregir pregunta ──────────────────────────────────────────
  const handleCorregir = async () => {
    if (!selectedOption || !testActivo) return;
    const pregunta = testActivo.preguntas[currentIdx];

    try {
      const res = await fetch(`http://localhost:3001/api/preguntas/corregir/${pregunta.id_pregunta}`);
      const data = await res.json();
      setCorreccion(data);

      if (selectedOption === data.respuesta_correcta) {
        setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      } else {
        setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
      }
    } catch {
      toast.error('Error al corregir la pregunta');
    }
  };

  // ── Siguiente pregunta ─────────────────────────────────────────
  const handleNext = () => {
    if (!testActivo) return;
    if (currentIdx < testActivo.preguntas.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setCorreccion(null);
    } else {
      setTestFinished(true);
    }
  };

  // ── Guardar resultado ──────────────────────────────────────────
  const guardarResultado = useCallback(async () => {
    if (!testActivo || !user?.id) return;
    const total = testActivo.preguntas.length;
    const nota = parseFloat(((score.correct / total) * 10).toFixed(2));

    await fetch('http://localhost:3001/api/preguntas/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_persona: user.id,
        id_bloque: testActivo.id_bloque,
        id_tema: testActivo.id_tema,
        total_preguntas: total,
        correctas: score.correct,
        incorrectas: score.incorrect,
        nota,
        tiempo_segundos: timeUsed,
        es_simulacro: 0,
      }),
    });
  }, [testActivo, user?.id, score, timeUsed]);

  useEffect(() => {
    if (testFinished) guardarResultado();
  }, [testFinished, guardarResultado]);

  // ── Pantalla de resultado final ────────────────────────────────
  if (testActivo && testFinished) {
    const total = testActivo.preguntas.length;
    const nota = ((score.correct / total) * 10).toFixed(1);
    const aprobado = parseFloat(nota) >= 5;

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-2xl mx-auto mt-8 text-center">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${aprobado ? 'bg-green-100' : 'bg-red-100'}`}>
          {aprobado
            ? <CheckCircle2 className="w-12 h-12 text-green-600" />
            : <XCircle className="w-12 h-12 text-red-600" />}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">{aprobado ? '¡Test Superado!' : 'Test Suspendido'}</h2>
        <p className="text-gray-500 mb-2">{testActivo.nombre_tema}</p>
        <p className="text-gray-400 text-sm mb-8">Tiempo empleado: {formatTime(timeUsed)}</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{nota}</div>
            <div className="text-sm text-gray-500">Nota</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="text-2xl font-bold text-green-600">{score.correct}</div>
            <div className="text-sm text-green-700">Aciertos</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <div className="text-2xl font-bold text-red-600">{score.incorrect}</div>
            <div className="text-sm text-red-700">Fallos</div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => iniciarTest(
              bloques.find(b => b.id_bloque === testActivo.id_bloque)!,
              { id_tema: testActivo.id_tema, nombre: testActivo.nombre_tema }
            )}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
          >
            <RotateCcw className="w-5 h-5" /> Repetir Test
          </button>
          <button
            onClick={() => setTestActivo(null)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    );
  }

  // ── Pantalla de pregunta activa ────────────────────────────────
  if (testActivo) {
    const pregunta = testActivo.preguntas[currentIdx];
    const opciones = [
      { letra: 'a' as const, texto: pregunta.opcion_a },
      { letra: 'b' as const, texto: pregunta.opcion_b },
      { letra: 'c' as const, texto: pregunta.opcion_c },
      ...(pregunta.opcion_d ? [{ letra: 'd' as const, texto: pregunta.opcion_d }] : []),
    ];

    return (
      <div className="max-w-3xl mx-auto mt-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
              <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
            </span>
            <div className="text-center">
              <p className="text-xs text-gray-400">{testActivo.nombre_tema}</p>
              <p className="text-gray-600 font-medium">Pregunta {currentIdx + 1} de {testActivo.preguntas.length}</p>
            </div>
            <button onClick={() => setTestActivo(null)} className="text-gray-400 hover:text-red-500 font-medium transition-colors text-sm">
              Abandonar
            </button>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentIdx / testActivo.preguntas.length) * 100}%` }}
            />
          </div>

          {/* Enunciado */}
          <h3 className="text-xl font-bold text-gray-900 leading-snug mb-6">{pregunta.enunciado}</h3>

          {/* Opciones */}
          <div className="space-y-3">
            {opciones.map(({ letra, texto }) => {
              let cls = "border-gray-200 hover:bg-blue-50 hover:border-blue-300 bg-white";
              let icon = null;

              if (correccion) {
                if (letra === correccion.respuesta_correcta) {
                  cls = "border-green-500 bg-green-50 text-green-900 ring-1 ring-green-500";
                  icon = <CheckCircle2 className="w-6 h-6 text-green-500 ml-auto shrink-0" />;
                } else if (letra === selectedOption) {
                  cls = "border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500";
                  icon = <XCircle className="w-6 h-6 text-red-500 ml-auto shrink-0" />;
                } else {
                  cls = "border-gray-200 bg-gray-50 opacity-60";
                }
              } else if (selectedOption === letra) {
                cls = "border-blue-500 bg-blue-50 ring-2 ring-blue-500";
              }

              return (
                <label
                  key={letra}
                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${cls} ${correccion ? 'pointer-events-none' : ''}`}
                  onClick={() => !correccion && setSelectedOption(letra)}
                >
                  {!correccion && (
                    <input type="radio" name="opcion" checked={selectedOption === letra} onChange={() => {}} className="w-5 h-5 text-blue-600 border-gray-300" />
                  )}
                  <span className={`font-bold w-6 text-center mx-2 ${correccion ? '' : ''}`}>{letra.toUpperCase()}</span>
                  <span className="font-medium text-gray-700 flex-1">{texto}</span>
                  {icon}
                </label>
              );
            })}
          </div>

          {/* Explicación */}
          {correccion?.explicacion && (
            <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-xl">
              <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" /> Explicación
              </h4>
              <p className="text-blue-800 text-sm leading-relaxed">{correccion.explicacion}</p>
            </div>
          )}

          {/* Botones */}
          <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-100">
            <div className="flex gap-2">
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">✓ {score.correct}</span>
              <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">✗ {score.incorrect}</span>
            </div>
            {!correccion ? (
              <button
                onClick={handleCorregir}
                disabled={selectedOption === null}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                Corregir <Zap className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {currentIdx < testActivo.preguntas.length - 1 ? 'Siguiente' : 'Finalizar'} <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard principal ────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tipo Test</h2>
          <p className="text-gray-500">Selecciona un bloque y un tema para empezar</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => navigate('/crear-test')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl shadow-md flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" /> Crear Test
          </button>
        )}
      </div>

      {loadingBloques ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mr-3" /> Cargando temario...
        </div>
      ) : (
        <div className="space-y-3">
          {bloques.map((bloque, bi) => {
            const { bg, text } = COLORES_BLOQUE[bi % COLORES_BLOQUE.length];
            const abierto = bloqueAbierto === bloque.id_bloque;

            return (
              <div key={bloque.id_bloque} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Cabecera del bloque */}
                <button
                  onClick={() => setBloqueAbierto(abierto ? null : bloque.id_bloque)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 ${bg} ${text} rounded-xl flex items-center justify-center shrink-0`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900">{bloque.nombre_bloque}</p>
                    <p className="text-sm text-gray-400">{bloque.temas.length} temas</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${abierto ? 'rotate-90' : ''}`} />
                </button>

                {/* Temas del bloque */}
                {abierto && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {bloque.temas.map(tema => (
                      <button
                        key={tema.id_tema}
                        onClick={() => iniciarTest(bloque, tema)}
                        disabled={loadingTest}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-blue-50 transition-colors text-left group"
                      >
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shrink-0">
                          {tema.id_tema}
                        </div>
                        <span className="flex-1 text-gray-700 font-medium group-hover:text-blue-700 transition-colors">{tema.nombre}</span>
                        {loadingTest
                          ? <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
                          : <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Simulacro */}
      <div className="mt-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <BarChart2 className="w-64 h-64" />
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-2">Simulacro Oficial Oposición Cáceres</h3>
            <p className="text-slate-300 mb-4">100 preguntas de todos los bloques, 90 minutos. Igual que el examen real.</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <AlertCircle className="w-4 h-4 text-yellow-400" /> Penaliza 0.33 por fallo
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Clock className="w-4 h-4 text-blue-400" /> 90 min
              </div>
            </div>
          </div>
          <div className="flex justify-start md:justify-end">
            <button className="bg-white text-slate-900 hover:bg-blue-50 font-bold py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-3 opacity-60 cursor-not-allowed">
              <PlayCircle className="w-6 h-6 text-blue-600" /> Próximamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
