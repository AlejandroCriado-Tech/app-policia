import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, ArrowRight, CheckCircle2, XCircle,
  Zap, RotateCcw, Loader2, BookOpen, AlertCircle
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
};

type Correccion = {
  respuesta_correcta: string;
  explicacion: string | null;
};

type Fase = "cargando" | "test" | "resultado" | "vacio";

const APROBADO_MIN = 5;

export function TestView() {
  const { id_bloque, id_tema } = useParams<{ id_bloque: string; id_tema: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fase, setFase] = useState<Fase>("cargando");
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<"a" | "b" | "c" | "d" | null>(null);
  const [correccion, setCorreccion] = useState<Correccion | null>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [notaFinal, setNotaFinal] = useState(0);
  const [guardando, setGuardando] = useState(false);

  // Nombre del tema/bloque (obtenido del endpoint de temas)
  const [nombreTest, setNombreTest] = useState("Test");

  useEffect(() => {
    if (!id_bloque || !id_tema) return;
    cargarPreguntas();
    cargarNombreTema();
  }, [id_bloque, id_tema]);

  const cargarNombreTema = async () => {
    try {
      const res = await fetch(`${API_URL}/api/preguntas/temas`);
      const bloques = await res.json();
      const bloque = bloques.find((b: any) => b.id_bloque === parseInt(id_bloque!));
      if (bloque) {
        const tema = bloque.temas.find((t: any) => t.id_tema === parseInt(id_tema!));
        if (tema) setNombreTest(`Bloque ${id_bloque} · ${tema.nombre}`);
      }
    } catch {
      // silencioso
    }
  };

  const cargarPreguntas = async () => {
    setFase("cargando");
    try {
      const res = await fetch(`${API_URL}/api/preguntas/${id_bloque}/${id_tema}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setFase("vacio");
        return;
      }
      setPreguntas(data);
      setCurrentIdx(0);
      setSelectedOption(null);
      setCorreccion(null);
      setScore({ correct: 0, incorrect: 0 });
      setFase("test");
    } catch {
      toast.error("Error al cargar las preguntas");
      setFase("vacio");
    }
  };

  const handleCorregir = async () => {
    if (!selectedOption || !preguntas.length) return;
    const pregunta = preguntas[currentIdx];
    try {
      const res = await fetch(`${API_URL}/api/preguntas/corregir/${pregunta.id_pregunta}`);
      const data: Correccion = await res.json();
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
      finalizarTest();
    }
  };

  const finalizarTest = useCallback(() => {
    const correctas = score.correct + (correccion && selectedOption === correccion.respuesta_correcta ? 0 : 0);
    // score ya está actualizado por handleCorregir
    const nota = parseFloat(((score.correct / preguntas.length) * 10).toFixed(2));
    setNotaFinal(nota);
    setFase("resultado");
    guardarResultado(nota, score.correct, score.incorrect);
  }, [score, preguntas.length]);

  const guardarResultado = async (nota: number, correctas: number, incorrectas: number) => {
    if (!user?.id) return;
    setGuardando(true);
    try {
      await fetch(`${API_URL}/api/preguntas/resultado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_persona: user.id,
          id_bloque: parseInt(id_bloque!),
          id_tema: parseInt(id_tema!),
          total_preguntas: preguntas.length,
          correctas,
          incorrectas,
          nota,
          tiempo_segundos: null,
          es_simulacro: 0,
        }),
      });
    } catch {
      // silencioso — no bloqueamos al usuario si falla el guardado
    } finally {
      setGuardando(false);
    }
  };

  // ── CARGANDO ──────────────────────────────────────────────────
  if (fase === "cargando") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // ── SIN PREGUNTAS ─────────────────────────────────────────────
  if (fase === "vacio") {
    return (
      <div className="max-w-xl mx-auto mt-12 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sin preguntas disponibles</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            El profesor aún no ha subido preguntas para este tema.
          </p>
          <button
            onClick={() => navigate("/tests")}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Tests
          </button>
        </div>
      </div>
    );
  }

  // ── RESULTADO ─────────────────────────────────────────────────
  if (fase === "resultado") {
    const aprobado = notaFinal >= APROBADO_MIN;
    const noRespondidas = preguntas.length - score.correct - score.incorrect;
    const pct = Math.round((score.correct / preguntas.length) * 100);

    return (
      <div className="max-w-xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${aprobado ? "bg-green-100 dark:bg-green-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
            {aprobado
              ? <CheckCircle2 className="w-12 h-12 text-green-500" />
              : <XCircle className="w-12 h-12 text-red-500" />
            }
          </div>

          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
            {notaFinal.toFixed(2)} / 10
          </h2>
          <p className={`text-xl font-bold mb-1 ${aprobado ? "text-green-600" : "text-red-500"}`}>
            {aprobado ? "¡APROBADO!" : "SUSPENSO"}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">{nombreTest}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
            {pct}% de aciertos
          </p>

          {/* Barra de progreso visual */}
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-8">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${aprobado ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
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
          </div>

          {guardando && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center justify-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Guardando resultado...
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/tests")}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-5 py-3 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <button
              onClick={cargarPreguntas}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Repetir test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── TEST ──────────────────────────────────────────────────────
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
      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/tests")}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 truncate">{nombreTest}</p>
        </div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">
          {currentIdx + 1} / {preguntas.length}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-6">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progreso}%` }}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
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
                  <input
                    type="radio"
                    name="opcion"
                    checked={selectedOption === letra}
                    onChange={() => {}}
                    className="w-5 h-5 text-blue-600 border-gray-300"
                  />
                )}
                <span className="font-bold w-6 text-center mx-2 text-gray-700 dark:text-gray-200">
                  {letra.toUpperCase()}
                </span>
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
            <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
              {correccion.explicacion}
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="flex gap-2">
            <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
              ✓ {score.correct}
            </span>
            <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
              ✗ {score.incorrect}
            </span>
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
              {currentIdx < preguntas.length - 1 ? "Siguiente" : "Finalizar"}{" "}
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
