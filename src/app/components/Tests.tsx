import { useState, useEffect, useCallback } from "react";
import {
  Clock, BarChart2, Zap, AlertCircle, PlayCircle,
  CheckCircle2, XCircle, ArrowRight, RotateCcw, PlusCircle,
  ChevronRight, Loader2, BookOpen, Trash2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { API_URL } from '../lib/api';

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

type Version = { numero_test: number; total: number };

type TestActivo = {
  id_bloque: number;
  id_tema: number;
  nombre_bloque: string;
  nombre_tema: string;
  numero_test: number;
  preguntas: Pregunta[];
};

export function Tests() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [loadingBloques, setLoadingBloques] = useState(true);
  const [bloqueAbierto, setBloqueAbierto] = useState<number | null>(null);
  const [temaExpandido, setTemaExpandido] = useState<string | null>(null);
  const [versiones, setVersiones] = useState<Record<string, Version[]>>({});
  const [loadingVersiones, setLoadingVersiones] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const [testActivo, setTestActivo] = useState<TestActivo | null>(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'a'|'b'|'c'|'d' | null>(null);
  const [correccion, setCorreccion] = useState<{ respuesta_correcta: string; explicacion: string | null } | null>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [testFinished, setTestFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [timeUsed, setTimeUsed] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/preguntas/temas`)
      .then(r => r.json())
      .then(setBloques)
      .catch(() => toast.error('Error cargando temario'))
      .finally(() => setLoadingBloques(false));
  }, []);

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

  // ── Expandir/colapsar tema y cargar versiones ──────────────────
  const toggleTema = async (bloque: Bloque, tema: { id_tema: number; nombre: string }) => {
    const clave = `${bloque.id_bloque}-${tema.id_tema}`;
    if (temaExpandido === clave) {
      setTemaExpandido(null);
      return;
    }
    setTemaExpandido(clave);
    if (!versiones[clave]) {
      setLoadingVersiones(clave);
      try {
        const res = await fetch(`${API_URL}/api/preguntas/versiones/${bloque.id_bloque}/${tema.id_tema}`);
        const data: Version[] = await res.json();
        setVersiones(prev => ({ ...prev, [clave]: data }));
      } catch {
        toast.error('Error al cargar los tests');
      } finally {
        setLoadingVersiones(null);
      }
    }
  };

  // ── Iniciar test de una versión concreta ───────────────────────
  const iniciarTest = async (bloque: Bloque, tema: { id_tema: number; nombre: string }, numero_test: number) => {
    setLoadingTest(true);
    try {
      const res = await fetch(`${API_URL}/api/preguntas/${bloque.id_bloque}/${tema.id_tema}?numero_test=${numero_test}`);
      const preguntas: Pregunta[] = await res.json();
      if (!preguntas.length) {
        toast.error('Este test no tiene preguntas.');
        return;
      }
      setTestActivo({
        id_bloque: bloque.id_bloque,
        id_tema: tema.id_tema,
        nombre_bloque: bloque.nombre_bloque,
        nombre_tema: tema.nombre,
        numero_test,
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

  // ── Eliminar todos los tests de un tema ────────────────────────
  const handleEliminar = async (id_bloque: number, id_tema: number, nombre: string) => {
    const clave = `${id_bloque}-${id_tema}`;
    if (!window.confirm(`¿Eliminar TODOS los tests de "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setEliminando(clave);
    try {
      const res = await fetch(`${API_URL}/api/preguntas/eliminar/${id_bloque}/${id_tema}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      toast.success(`Todos los tests de "${nombre}" eliminados (${data.eliminadas} preguntas)`);
      setVersiones(prev => { const u = { ...prev }; delete u[clave]; return u; });
      setTemaExpandido(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar las preguntas');
    } finally {
      setEliminando(null);
    }
  };

  // ── Eliminar una versión concreta de test ──────────────────────
  const handleEliminarVersion = async (id_bloque: number, id_tema: number, numero_test: number) => {
    const clave = `${id_bloque}-${id_tema}`;
    if (!window.confirm(`¿Eliminar el Test ${numero_test}? Esta acción no se puede deshacer.`)) return;
    setEliminando(`${clave}-${numero_test}`);
    try {
      const res = await fetch(
        `${API_URL}/api/preguntas/eliminar/${id_bloque}/${id_tema}?numero_test=${numero_test}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      toast.success(`Test ${numero_test} eliminado (${data.eliminadas} preguntas)`);
      // Recargar versiones del tema
      const freshRes = await fetch(`${API_URL}/api/preguntas/versiones/${id_bloque}/${id_tema}`);
      const freshData: Version[] = await freshRes.json();
      setVersiones(prev => ({ ...prev, [clave]: freshData }));
      if (freshData.length === 0) setTemaExpandido(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    } finally {
      setEliminando(null);
    }
  };

  // ── Eliminar preguntas del simulacro ───────────────────────────
  const handleEliminarSimulacro = async () => {
    if (!window.confirm('¿Eliminar TODAS las preguntas del Simulacro? Esta acción no se puede deshacer.')) return;
    setEliminando('simulacro');
    try {
      const res = await fetch(`${API_URL}/api/preguntas/eliminar/0/0`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      toast.success(`Preguntas del Simulacro eliminadas (${data.eliminadas})`);
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar las preguntas del simulacro');
    } finally {
      setEliminando(null);
    }
  };

  const handleCorregir = async () => {
    if (!selectedOption || !testActivo) return;
    const pregunta = testActivo.preguntas[currentIdx];
    try {
      const res = await fetch(`${API_URL}/api/preguntas/corregir/${pregunta.id_pregunta}`);
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

  const guardarResultado = useCallback(async () => {
    if (!testActivo || !user?.id) return;
    const total = testActivo.preguntas.length;
    const nota = parseFloat(((score.correct / total) * 10).toFixed(2));
    await fetch(`${API_URL}/api/preguntas/resultado`, {
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

  // ── Pantalla resultado final ───────────────────────────────────
  if (testActivo && testFinished) {
    const total = testActivo.preguntas.length;
    const nota = ((score.correct / total) * 10).toFixed(1);
    const aprobado = parseFloat(nota) >= 5;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 max-w-2xl mx-auto mt-8 text-center">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${aprobado ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
          {aprobado
            ? <CheckCircle2 className="w-10 h-10 text-green-500" />
            : <XCircle className="w-10 h-10 text-red-500" />
          }
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{nota} / 10</h2>
        <p className={`text-lg font-semibold mb-6 ${aprobado ? 'text-green-600' : 'text-red-500'}`}>
          {aprobado ? '¡Aprobado!' : 'Suspendido'}
        </p>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-600">{score.correct}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Correctas</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-red-500">{score.incorrect}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Incorrectas</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{formatTime(timeUsed)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tiempo</p>
          </div>
        </div>
        <button
          onClick={() => setTestActivo(null)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto"
        >
          <RotateCcw className="w-5 h-5" /> Volver al temario
        </button>
      </div>
    );
  }

  // ── Test activo ────────────────────────────────────────────────
  if (testActivo) {
    const pregunta = testActivo.preguntas[currentIdx];
    const opciones = [
      { letra: 'a' as const, texto: pregunta.opcion_a },
      { letra: 'b' as const, texto: pregunta.opcion_b },
      { letra: 'c' as const, texto: pregunta.opcion_c },
      ...(pregunta.opcion_d ? [{ letra: 'd' as const, texto: pregunta.opcion_d }] : []),
    ];

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          {/* Header test */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">{testActivo.nombre_bloque}</p>
              <p className="font-bold text-gray-900 dark:text-white">{testActivo.nombre_tema}</p>
              <p className="text-xs text-blue-500 font-medium mt-0.5">Test {testActivo.numero_test}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-2 rounded-xl ${timeLeft < 300 ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
                <Clock className="w-5 h-5" />
                {formatTime(timeLeft)}
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {currentIdx + 1} / {testActivo.preguntas.length}
              </span>
            </div>
            <button onClick={() => setTestActivo(null)} className="text-gray-400 hover:text-red-500 font-medium transition-colors text-sm">
              Abandonar
            </button>
          </div>

          {/* Barra progreso */}
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-8">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentIdx / testActivo.preguntas.length) * 100}%` }}
            />
          </div>

          {/* Enunciado */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-snug mb-6">{pregunta.enunciado}</h3>

          {/* Opciones */}
          <div className="space-y-3">
            {opciones.map(({ letra, texto }) => {
              let cls = "border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 bg-white dark:bg-gray-700";
              let icon = null;

              if (correccion) {
                if (letra === correccion.respuesta_correcta) {
                  cls = "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-300 ring-1 ring-green-500";
                  icon = <CheckCircle2 className="w-6 h-6 text-green-500 ml-auto shrink-0" />;
                } else if (letra === selectedOption) {
                  cls = "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-300 ring-1 ring-red-500";
                  icon = <XCircle className="w-6 h-6 text-red-500 ml-auto shrink-0" />;
                } else {
                  cls = "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 opacity-60";
                }
              } else if (selectedOption === letra) {
                cls = "border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500";
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
                  <span className="font-bold w-6 text-center mx-2 text-gray-700 dark:text-gray-200">{letra.toUpperCase()}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-200 flex-1">{texto}</span>
                  {icon}
                </label>
              );
            })}
          </div>

          {/* Explicación */}
          {correccion?.explicacion && (
            <div className="mt-6 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
              <h4 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" /> Explicación
              </h4>
              <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">{correccion.explicacion}</p>
            </div>
          )}

          {/* Botones */}
          <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="flex gap-2">
              <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">✓ {score.correct}</span>
              <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">✗ {score.incorrect}</span>
            </div>
            {!correccion ? (
              <button
                onClick={handleCorregir}
                disabled={selectedOption === null}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2"
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tipo Test</h2>
          <p className="text-gray-500 dark:text-gray-400">Selecciona un bloque y un tema para empezar</p>
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
        <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mr-3" /> Cargando temario...
        </div>
      ) : (
        <div className="space-y-3">
          {bloques.map((bloque, bi) => {
            const { bg, text } = COLORES_BLOQUE[bi % COLORES_BLOQUE.length];
            const abierto = bloqueAbierto === bloque.id_bloque;

            return (
              <div key={bloque.id_bloque} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <button
                  onClick={() => setBloqueAbierto(abierto ? null : bloque.id_bloque)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className={`w-10 h-10 ${bg} ${text} rounded-xl flex items-center justify-center shrink-0`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-900 dark:text-white">{bloque.nombre_bloque}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">{bloque.temas.length} temas</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${abierto ? 'rotate-90' : ''}`} />
                </button>

                {abierto && (
                  <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
                    {bloque.temas.map(tema => {
                      const clave = `${bloque.id_bloque}-${tema.id_tema}`;
                      const estaEliminando = eliminando === clave;
                      const expandido = temaExpandido === clave;
                      const vers = versiones[clave] || [];
                      const isLoadingVers = loadingVersiones === clave;

                      return (
                        <div key={tema.id_tema}>
                          {/* Fila del tema */}
                          <div className="flex items-center group hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <button
                              onClick={() => toggleTema(bloque, tema)}
                              disabled={loadingTest || !!eliminando}
                              className="flex-1 flex items-center gap-4 px-6 py-4 text-left disabled:opacity-50"
                            >
                              <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-600 transition-colors shrink-0">
                                {tema.id_tema}
                              </div>
                              <span className="flex-1 text-gray-700 dark:text-gray-300 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                                {tema.nombre}
                              </span>
                              {vers.length > 0 && (
                                <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                  {vers.length} {vers.length === 1 ? 'test' : 'tests'}
                                </span>
                              )}
                              <ChevronRight className={`w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-all ${expandido ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Botón eliminar todos: solo admin */}
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => handleEliminar(bloque.id_bloque, tema.id_tema, tema.nombre)}
                                disabled={!!eliminando}
                                title="Eliminar todos los tests de este tema"
                                className="mr-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                              >
                                {estaEliminando
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Trash2 className="w-4 h-4" />
                                }
                              </button>
                            )}
                          </div>

                          {/* Sub-lista de versiones */}
                          {expandido && (
                            <div className="bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700/50">
                              {isLoadingVers ? (
                                <div className="flex items-center gap-3 pl-16 pr-6 py-4 text-gray-400 dark:text-gray-500 text-sm">
                                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando tests...
                                </div>
                              ) : vers.length === 0 ? (
                                <div className="pl-16 pr-6 py-4 text-sm text-gray-400 dark:text-gray-500 italic">
                                  No hay tests disponibles. El profesor debe añadirlos desde "Crear Test".
                                </div>
                              ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700/40">
                                  {vers.map(v => {
                                    const vClave = `${bloque.id_bloque}-${tema.id_tema}-${v.numero_test}`;
                                    const estaEliminandoV = eliminando === vClave;
                                    return (
                                      <div key={v.numero_test} className="flex items-center group/v hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                        <button
                                          onClick={() => iniciarTest(bloque, tema, v.numero_test)}
                                          disabled={loadingTest || !!eliminando}
                                          className="flex-1 flex items-center gap-3 pl-14 pr-4 py-3 text-left disabled:opacity-50"
                                        >
                                          <PlayCircle className="w-5 h-5 text-blue-400 shrink-0" />
                                          <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover/v:text-blue-700 dark:group-hover/v:text-blue-400 transition-colors">
                                            Test {v.numero_test}
                                          </span>
                                          <span className="text-sm text-gray-400 dark:text-gray-500">
                                            {v.total} preguntas
                                          </span>
                                          {loadingTest && <Loader2 className="w-4 h-4 text-gray-300 animate-spin ml-auto" />}
                                        </button>
                                        {user?.role === 'admin' && (
                                          <button
                                            onClick={() => handleEliminarVersion(bloque.id_bloque, tema.id_tema, v.numero_test)}
                                            disabled={!!eliminando}
                                            title={`Eliminar Test ${v.numero_test}`}
                                            className="mr-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover/v:opacity-100 disabled:opacity-30"
                                          >
                                            {estaEliminandoV
                                              ? <Loader2 className="w-4 h-4 animate-spin" />
                                              : <Trash2 className="w-4 h-4" />
                                            }
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
          <div className="flex flex-col items-start md:items-end gap-3">
            <button className="bg-white text-slate-900 hover:bg-blue-50 font-bold py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-3 opacity-60 cursor-not-allowed">
              <PlayCircle className="w-6 h-6 text-blue-600" /> Próximamente
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={handleEliminarSimulacro}
                disabled={!!eliminando}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 px-4 py-2 rounded-lg transition-all disabled:opacity-40"
              >
                {eliminando === 'simulacro'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />
                }
                Eliminar preguntas del Simulacro
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
