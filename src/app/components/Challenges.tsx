import { Trophy, Star, Target, Zap, Shield, Crown } from "lucide-react";

const medals = [
  { id: 1, name: "Constancia", desc: "Estudia 7 días seguidos", icon: Zap, color: "yellow", achieved: false, date: null },
  { id: 2, name: "Experto en Leyes", desc: "Aprobados 10 tests de Derecho Penal", icon: Shield, color: "blue", achieved: false, date: null },
  { id: 3, name: "Constitucionalista", desc: "10/10 en un simulacro de la Constitución", icon: Crown, color: "purple", achieved: false, date: null },
  { id: 4, name: "Cacereño de Pro", desc: "Termina el bloque de normativa local", icon: Target, color: "green", achieved: false, date: null },
];

export function Challenges() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Retos y Medallas</h2>
        <p className="text-lg text-gray-500">Supera desafíos y consigue recompensas para mantener la motivación alta</p>
      </div>

      {/* Current Challenge */}
      <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl p-8 text-gray-500 shadow-sm relative overflow-hidden text-center">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-bold mb-2">No hay retos activos</h3>
        <p>Aún no te has inscrito en ningún reto semanal.</p>
      </div>

      {/* Medals Grid */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Star className="w-6 h-6 text-yellow-500" fill="currentColor" />
          Tus Medallas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {medals.map(medal => (
            <div 
              key={medal.id} 
              className={`bg-white rounded-2xl border ${medal.achieved ? 'border-gray-200 shadow-md' : 'border-gray-100 border-dashed shadow-sm'} p-6 relative overflow-hidden flex flex-col items-center text-center transition-transform hover:-translate-y-1`}
            >
              {!medal.achieved && (
                <div className="absolute inset-0 bg-gray-50/50 backdrop-blur-[1px] z-10"></div>
              )}
              
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 relative ${medal.achieved ? `bg-${medal.color}-100` : 'bg-gray-100'}`}>
                {medal.achieved && (
                  <div className={`absolute -right-2 -top-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100`}>
                    <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                  </div>
                )}
                <medal.icon className={`w-10 h-10 ${medal.achieved ? `text-${medal.color}-500` : 'text-gray-400'}`} />
              </div>
              
              <h4 className={`text-lg font-bold mb-2 ${medal.achieved ? 'text-gray-900' : 'text-gray-500'}`}>{medal.name}</h4>
              <p className="text-sm text-gray-500 mb-4 flex-1">{medal.desc}</p>
              
              {medal.achieved ? (
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{medal.date}</span>
              ) : (
                <span className="text-xs font-medium text-gray-400 flex items-center gap-1 z-20">
                  <Target className="w-3 h-3" /> Por conseguir
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Ranking Mensual (Oposición Cáceres)</h3>
          <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">Tu posición: #42</span>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { pos: '-', name: "Tú", pts: 0, change: "same", isUser: true },
          ].map((user) => (
            <div key={user.pos} className={`p-4 flex items-center gap-4 ${user.isUser ? 'bg-blue-50/50' : 'hover:bg-gray-50'} transition-colors`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-gray-100 text-gray-600`}>
                {user.pos}
              </div>
              <div className="flex-1 font-medium text-gray-900 flex items-center gap-2">
                {user.name}
                {user.isUser && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Tú</span>}
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-900">{user.pts} <span className="text-gray-400 text-sm font-normal">pts</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
