import { Trophy, Star, Target, Zap, Shield, Crown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

// Mapa de iconos por nombre (coincide con lo que guardamos en BD)
const iconMap: Record<string, React.ElementType> = {
  zap: Zap,
  shield: Shield,
  crown: Crown,
  target: Target,
  trophy: Trophy,
  star: Star,
};

const colorMap: Record<string, string> = {
  yellow: "bg-yellow-100 text-yellow-500",
  blue:   "bg-blue-100 text-blue-500",
  purple: "bg-purple-100 text-purple-500",
  green:  "bg-green-100 text-green-500",
};

type Reto = {
  id_reto: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  objetivo: number;
  puntos: number;
  progreso: number;
  completado: number;
  fecha_completado: string | null;
};

type Medalla = {
  id_medalla: number;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  conseguida: number;
  fecha_obtenida: string | null;
};

type RankingUser = {
  id_persona: number;
  nombre: string;
  apellido1: string;
  puntos_totales: number;
};

export function Challenges() {
  const { user } = useAuth();
  const [retos, setRetos] = useState<Reto[]>([]);
  const [medallas, setMedallas] = useState<Medalla[]>([]);
  const [puntos, setPuntos] = useState(0);
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    fetch(`http://localhost:3001/api/retos/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setRetos(data.retos || []);
        setMedallas(data.medallas || []);
        setPuntos(data.puntos_totales || 0);
        setRanking(data.ranking || []);
      })
      .catch(err => console.error('Error cargando retos:', err))
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Reto con mayor progreso relativo que no esté completado
  const retoDestacado = retos
    .filter(r => !r.completado)
    .sort((a, b) => (b.progreso / b.objetivo) - (a.progreso / a.objetivo))[0];

  // Posición del usuario en el ranking
  const miPosicion = ranking.findIndex(r => r.id_persona === user?.id) + 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        Cargando retos...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Retos y Medallas</h2>
        <p className="text-lg text-gray-500">Supera desafíos y consigue recompensas para mantener la motivación alta</p>
      </div>

      {/* Reto destacado */}
      {retoDestacado ? (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-sm relative overflow-hidden">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-white/80 block md:hidden" />
          <div className="flex items-center gap-6">
            <Trophy className="w-14 h-14 text-white/80 hidden md:block shrink-0" />
            <div className="flex-1">
              <p className="text-white/70 text-sm font-medium mb-1 uppercase tracking-wider">Reto en progreso</p>
              <h3 className="text-2xl font-bold mb-1">{retoDestacado.nombre}</h3>
              <p className="text-white/80 mb-4">{retoDestacado.descripcion}</p>
              {/* Barra de progreso */}
              <div className="bg-white/20 rounded-full h-3 w-full">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${Math.min((retoDestacado.progreso / retoDestacado.objetivo) * 100, 100)}%` }}
                />
              </div>
              <p className="text-white/70 text-sm mt-2">
                {retoDestacado.progreso} / {retoDestacado.objetivo} · {retoDestacado.puntos} pts al completar
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl p-8 text-gray-500 shadow-sm text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold mb-2">¡Todos los retos completados!</h3>
          <p>Eres un máquina. No hay más retos pendientes.</p>
        </div>
      )}

      {/* Medallas */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Star className="w-6 h-6 text-yellow-500" fill="currentColor" />
          Tus Medallas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {medallas.map(medalla => {
            const Icon = iconMap[medalla.icono] || Trophy;
            const colorClass = colorMap[medalla.color] || "bg-gray-100 text-gray-400";
            const achieved = medalla.conseguida === 1;

            return (
              <div
                key={medalla.id_medalla}
                className={`bg-white rounded-2xl border ${achieved ? 'border-gray-200 shadow-md' : 'border-dashed border-gray-200 shadow-sm'} p-6 relative overflow-hidden flex flex-col items-center text-center transition-transform hover:-translate-y-1`}
              >
                {!achieved && (
                  <div className="absolute inset-0 bg-gray-50/50 backdrop-blur-[1px] z-10" />
                )}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 relative ${achieved ? colorClass.split(' ')[0] : 'bg-gray-100'}`}>
                  {achieved && (
                    <div className="absolute -right-2 -top-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                      <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    </div>
                  )}
                  <Icon className={`w-10 h-10 ${achieved ? colorClass.split(' ')[1] : 'text-gray-400'}`} />
                </div>
                <h4 className={`text-lg font-bold mb-2 ${achieved ? 'text-gray-900' : 'text-gray-400'}`}>{medalla.nombre}</h4>
                <p className="text-sm text-gray-500 mb-4 flex-1">{medalla.descripcion}</p>
                {achieved ? (
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {medalla.fecha_obtenida}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-400 flex items-center gap-1 z-20">
                    <Target className="w-3 h-3" /> Por conseguir
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ranking */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Ranking (Oposición Cáceres)</h3>
          {miPosicion > 0 && (
            <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
              Tu posición: #{miPosicion}
            </span>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {ranking.length === 0 ? (
            <p className="p-6 text-gray-400 text-center">Aún no hay alumnos en el ranking.</p>
          ) : (
            ranking.map((u, index) => {
              const esYo = u.id_persona === user?.id;
              const pos = index + 1;
              const medallaPos = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : null;

              return (
                <div
                  key={u.id_persona}
                  className={`p-4 flex items-center gap-4 ${esYo ? 'bg-blue-50/50' : 'hover:bg-gray-50'} transition-colors`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${esYo ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {medallaPos || pos}
                  </div>
                  <div className="flex-1 font-medium text-gray-900 flex items-center gap-2">
                    {u.nombre} {u.apellido1}
                    {esYo && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Tú</span>}
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{u.puntos_totales} <span className="text-gray-400 text-sm font-normal">pts</span></span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}