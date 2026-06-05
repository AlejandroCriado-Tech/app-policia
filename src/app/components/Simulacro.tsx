import { useState, useEffect, useCallback } from "react";
import {
  Clock, AlertCircle, PlayCircle, CheckCircle2, XCircle,
  ArrowRight, RotateCcw, Zap, Loader2, ShieldAlert
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { API_URL } from '../lib/api';

type Pregunta = {
  id_pregunta: number;
  enunciado: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  opcion_d: string | null;
  nombre_bloque?: string;
  nombre_tema?: string;
};

type Fase = "inicio" | "test" | "resultado";

const TOTAL_PREGUNTAS = 100;
const TIEMPO_TOTAL = 90 * 60; // 90 minutos
const PENALIZACION = 0.33;

export function Simulacro() {
  const { user } = useAuth();

  const [fase, setFase] = useState<Fase>("inicio");
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [loadingPreguntas, setLoadingPreguntas] = useState(false);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<"a" | "b" | "c" | "d" | null>(null);
  const [correccion, setCorreccion] = useState<{ respuesta_correcta: string; explicacion: string | null } | null>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [timeLeft, setTimeLeft] = useState(TIEMPO_TOTAL);
  const [timeUsed, setTimeUsed] = useState(0);
  const [notaFinal, setNotaFinal] = useState<number>(0);

  // Temporizador
  useEffect(() => {
    if (fase !== "test") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setFase("resultado");
          return 0;
        }
        return prev - 1;
      });
      setTimeUsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [fase]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m.toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const iniciarSimulacro = async () => {
  setLoadingPreguntas(true);
  try {
    const res = await fetch(
      `${API_URL}/api/preguntas/simulacro?limit=${TOTAL_PREGUNTAS}`
    );

    if (!res.ok) {
      toast.error('No hay preguntas de simulacro. El profesor debe subir un PDF de simulacro.');
      return;
    }

    const data: Pregunta[] = await res.json();

    if (data.length < 10) {
      toast.error('No hay suficientes preguntas para el simulacro. El profesor debe añadir más.');
      return;
    }

    setPreguntas(data);
    setCurrentIdx(0);
    setSelectedOption(null);
    setCorreccion(null);
    setScore({ correct: 0, incorrect: 0 });
    setTimeLeft(TIEMPO_TOTAL);
    setTimeUsed(0);
    setFase('test');
  } catch {
    toast.error('Error al cargar las preguntas del simulacro');
  } finally {
    setLoadingPreguntas(false);
  }
};

  const handleCorregir = async () => {
    if (!selectedOption || !preguntas.length) return;
    const pregunta = preguntas[currentIdx];
    try {
      const res = await fetch(`${API_URL}/api/preguntas/corregir/${pregunta.id_pregunta}`);
      const data = await res.json();
      setCorreccion(data);
      if (selectedOption === data.respuesta_correcta) {
        setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
      } else {
        setScore((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
      }
    } catch {
      toast.error("Error al corregir la pregunta");
    }
  };

  const handleNext = () => {
    if (currentIdx < preguntas.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setCorreccion(null);
    } else {
      setFase("resultado");
    }
  };

  // Calcular nota con penalización al llegar a resultado
  useEffect(() => {
    if (fase !== "resultado") return;
    const aciertos = score.correct;
    const fallos = score.incorrect;
    const noRespondidas = preguntas.length - aciertos - fallos;
    // Fórmula oposición: aciertos - (fallos * 0.33), sobre total
    const puntos = aciertos - fallos * PENALIZACION;
    const nota = Math.max(0, parseFloat(((puntos / preguntas.length) * 10).toFixed(2)));
    setNotaFinal(nota);
    guardarResultado(nota, aciertos, fallos, noRespondidas);
  }, [fase]);

  const guardarResultado = useCallback(
    async (nota: number, correctas: number, incorrectas: number, _noRespondidas: number) => {
      if (!user?.id || !preguntas.length) return;
      await fetch(`${API_URL}/api/preguntas/resultado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_persona: user.id,
          id_bloque: 0,
          id_tema: 0,
          total_preguntas: preguntas.length,
          correctas,
          incorrectas,
          nota,
          tiempo_segundos: timeUsed,
          es_simulacro: 1,
        }),
      });
    },
    [user?.id, preguntas.length, timeUsed]
  );

  // ── FASE: INICIO ──────────────────────────────────────────────
  if (fase === "inicio") {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <ShieldAlert className="w-72 h-72" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Simulacro Oficial</h2>
                <p className="text-slate-400 text-sm">Academia Cáceres — Oposición Policía</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{TOTAL_PREGUNTAS}</p>
                <p className="text-slate-400 text-sm mt-1">Preguntas</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">90</p>
                <p className="text-slate-400 text-sm mt-1">Minutos</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">−0.33</p>
                <p className="text-slate-400 text-sm mt-1">Por fallo</p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-8 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-semibold text-yellow-300 mb-1">Condiciones del examen real</p>
                <p>Las preguntas se extraen aleatoriamente de todos los bloques del temario. Cada fallo resta 0.33 puntos. Las preguntas sin responder no penalizan. La nota mínima para aprobar es <strong className="text-white">5.00</strong>.</p>
              </div>
            </div>

            <button
              onClick={iniciarSimulacro}
              disabled={loadingPreguntas}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 text-lg"
            >
              {loadingPreguntas ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Cargando preguntas...</>
              ) : (
                <><PlayCircle className="w-6 h-6" /> Comenzar Simulacro</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FASE: RESULTADO ───────────────────────────────────────────
  if (fase === "resultado") {
    const aprobado = notaFinal >= 5;
    const noRespondidas = preguntas.length - score.correct - score.incorrect;

    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${aprobado ? "bg-green-100 dark:bg-green-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
            {aprobado
              ? <CheckCircle2 className="w-12 h-12 text-green-500" />
              : <XCircle className="w-12 h-12 text-red-500" />
            }
          </div>

          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{notaFinal.toFixed(2)} / 10</h2>
          <p className={`text-xl font-bold mb-2 ${aprobado ? "text-green-600" : "text-red-500"}`}>
            {aprobado ? "¡APROBADO!" : "SUSPENSO"}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
            Nota con penalización (aciertos − fallos × 0.33)
          </p>

          <div className="grid grid-cols-4 gap-3 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <p className="text-2xl font-bold text-green-600">{score.correct}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Correctas</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-500">{score.incorrect}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Incorrectas</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <p className="text-2xl font-bold text-gray-500 dark:text-gray-300">{noRespondidas}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sin responder</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="text-2xl font-bold text-blue-600">{formatTime(timeUsed)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tiempo</p>
            </div>
          </div>

          <button
            onClick={() => setFase("inicio")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-5 h-5" /> Nuevo simulacro
          </button>
        </div>
      </div>
    );
  }

  // ── FASE: TEST ────────────────────────────────────────────────
  const pregunta = preguntas[currentIdx];
  const opciones = [
    { letra: "a" as const, texto: pregunta.opcion_a },
    { letra: "b" as const, texto: pregunta.opcion_b },
    { letra: "c" as const, texto: pregunta.opcion_c },
    ...(pregunta.opcion_d ? [{ letra: "d" as const, texto: pregunta.opcion_d }] : []),
  ];
  const progreso = ((currentIdx + 1) / preguntas.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">Simulacro Oficial</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-2 rounded-xl ${timeLeft < 600 ? "bg-red-100 dark:bg-red-900/40 text-red-600" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {currentIdx + 1} / {preguntas.length}
            </span>
          </div>
          <button
            onClick={() => setFase("resultado")}
            className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors"
          >
            Entregar
          </button>
        </div>

        {/* Barra progreso */}
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-6">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progreso}%` }}
          />
        </div>

        {/* Enunciado */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-snug mb-6">
          {pregunta.enunciado}
        </h3>

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
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${cls} ${correccion ? "pointer-events-none" : ""}`}
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
              {currentIdx < preguntas.length - 1 ? "Siguiente" : "Finalizar"} <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
