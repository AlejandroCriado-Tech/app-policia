import { BookOpen, CheckSquare, Trophy, AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "react-router";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const performanceData: any[] = [];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <TrendingUp className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">¡Hola, Alejandro!</h2>
          <p className="text-blue-100 max-w-xl text-lg mb-6">
            Aún no has empezado a estudiar. ¡Mucho ánimo con la preparación de la próxima convocatoria!
          </p>
          <Link to="/tests" className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-sm">
            Empezar a Estudiar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Temas Estudiados</p>
            <h3 className="text-2xl font-bold text-gray-900">0 / 0</h3>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-4 rounded-xl text-green-600">
            <CheckSquare className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tests Aprobados</p>
            <h3 className="text-2xl font-bold text-gray-900">0</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-yellow-100 p-4 rounded-xl text-yellow-600">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Medallas Obtenidas</p>
            <h3 className="text-2xl font-bold text-gray-900">0</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Evolución de Notas (Últimos 7 días)</h3>
            <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2">
              <option>Esta semana</option>
              <option>Este mes</option>
              <option>Último trimestre</option>
            </select>
          </div>
          <div className="h-72 w-full" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop key="start" offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop key="end" offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Next Goal */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-gray-400" />
              Reto Actual
            </h3>
            <div className="text-center py-4 text-gray-500 text-sm">
              No hay retos activos en este momento.
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Última Actividad</h3>
            <div className="text-center py-4 text-gray-500 text-sm">
              No hay actividad reciente.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
