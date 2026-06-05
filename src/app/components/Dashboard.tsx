import { useState, useEffect } from "react";
import { BookOpen, CheckSquare, Trophy, TrendingUp, Flame, BarChart2, Clock, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../context/AuthContext";
import { API_URL } from '../lib/api';

type UltimoTest = {
  id_bloque: number;
  id_tema: number;
  total_preguntas: number;
  correctas: number;
  nota: number;
  fecha: string;
  es_simulacro: number;
};

type Stats = {
  tests_completados: number;
  nota_media: number;
  tests_aprobados: number;
  temas_estudiados: number;
  racha_dias: number;
  evolucion: { dia: string; nota: number }[];
  ultimos_tests: UltimoTest[];
};

// Valor por defecto seguro para cuando la API falla o devuelve null
const STATS_DEFAULT: Stats = {
  tests_completados: 0,
  nota_media: 0,
  tests_aprobados: 0,
  temas_estudiados: 0,
  racha_dias: 0,
  evolucion: [],
  ultimos_tests: [],
};

function normalizeStats(raw: any): Stats {
  return {
    tests_completados: Number(raw?.tests_completados ?? 0),
    nota_media: Number(raw?.nota_media ?? 0),
    tests_aprobados: Number(raw?.tests_aprobados ?? 0),
    temas_estudiados: Number(raw?.temas_estudiados ?? 0),
    racha_dias: Number(raw?.racha_dias ?? 0),
    evolucion: Array.isArray(raw?.evolucion) ? raw.evolucion : [],
    ultimos_tests: Array.isArray(raw?.ultimos_tests) ? raw.ultimos_tests : [],
  };
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>(STATS_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_URL}/api/preguntas/estadisticas/${user.id}`)
      .then((r) => r.json())
      .then((raw) => setStats(normalizeStats(raw)))
      .catch(() => setStats(STATS_DEFAULT))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const firstName = user?.name?.split(" ")[0] ?? "Alumno";
  const sinActividad = stats.tests_completados === 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <TrendingUp className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">¡Hola, {firstName}!</h2>
          {sinActividad ? (
            <p className="text-blue-100 max-w-xl text-lg mb-6">
              Aún no has empezado a estudiar. ¡Mucho ánimo con la preparación!
            </p>
          ) : (
            <p className="text-blue-100 max-w-xl text-lg mb-6">
              Llevas <strong>{stats.tests_completados}</strong> tests completados con una nota media de{" "}
              <strong>{stats.nota_media.toFixed(2)}</strong>. ¡Sigue así!
            </p>
          )}
          <Link
            to="/tests"
            className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-sm"
          >
            {sinActividad ? "Empezar a Estudiar" : "Seguir Estudiando"}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<BarChart2 className="w-7 h-7" />} color="blue" label="Tests Realizados" value={stats.tests_completados} />
          <StatCard icon={<CheckSquare className="w-7 h-7" />} color="green" label="Tests Aprobados" value={stats.tests_aprobados} />
          <StatCard icon={<BookOpen className="w-7 h-7" />} color="purple" label="Temas Estudiados" value={stats.temas_estudiados} />
          <StatCard icon={<Flame className="w-7 h-7" />} color="orange" label="Racha Actual" value={`${stats.racha_dias} día${stats.racha_dias !== 1 ? "s" : ""}`} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica evolución */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Evolución de Notas (Últimos 7 días)
          </h3>
          <div className="h-72 w-full" style={{ minWidth: 0 }}>
            {!loading && stats.evolucion.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={stats.evolucion} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} dy={10} />
                  <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", backgroundColor: "#1f2937", color: "#f9fafb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)" }}
                    formatter={(value: number) => [`${Number(value).toFixed(2)} / 10`, "Nota"]}
                  />
                  <Area type="monotone" dataKey="nota" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Aún no hay datos de evolución"}
              </div>
            )}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Racha */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Racha de Estudio
            </h3>
            {stats.racha_dias > 0 ? (
              <div className="text-center py-2">
                <p className="text-5xl font-bold text-orange-500 mb-1">{stats.racha_dias}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  día{stats.racha_dias !== 1 ? "s" : ""} consecutivo{stats.racha_dias !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-orange-400 mt-2 font-medium">🔥 ¡Sigue así!</p>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                Completa un test hoy para empezar tu racha.
              </div>
            )}
          </div>

          {/* Nota media */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Nota Media Global
            </h3>
            {stats.nota_media > 0 ? (
              <div className="text-center py-2">
                <p className={`text-5xl font-bold mb-1 ${stats.nota_media >= 5 ? "text-green-500" : "text-red-500"}`}>
                  {stats.nota_media.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">sobre 10</p>
                <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${stats.nota_media >= 5 ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${(stats.nota_media / 10) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                Aún no tienes nota media.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Últimos tests */}
      {stats.ultimos_tests.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Últimos Tests Realizados
          </h3>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {stats.ultimos_tests.map((t, i) => {
              const aprobado = Number(t.nota) >= 5;
              const fecha = new Date(t.fecha).toLocaleDateString("es-ES", {
                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
              });
              return (
                <div key={i} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${aprobado ? "bg-green-500" : "bg-red-500"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {t.es_simulacro ? "🏆 Simulacro Oficial" : `Bloque ${t.id_bloque} · Tema ${t.id_tema}`}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{fecha}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t.correctas}/{t.total_preguntas}
                    </span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${aprobado ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}>
                      {Number(t.nota).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type StatCardProps = {
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "orange";
  label: string;
  value: string | number;
};

const colorMap = {
  blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-600",
  green: "bg-green-100 dark:bg-green-900/40 text-green-600",
  purple: "bg-purple-100 dark:bg-purple-900/40 text-purple-600",
  orange: "bg-orange-100 dark:bg-orange-900/40 text-orange-500",
};

function StatCard({ icon, color, label, value }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{label}</p>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{value}</h3>
      </div>
    </div>
  );
}
