import { useState, useEffect } from "react";
import {
  Users, Search, CheckCircle2, XCircle,
  Loader2, BarChart2, Trophy, Clock, UserPlus
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { API_URL } from '../lib/api';

type Alumno = {
  id_persona: number;
  nombre: string;
  apellido1: string;
  apellido2: string | null;
  correo: string;
  dni: string;
  telefono: string | null;
  activo: number;
  fecha_registro: string | null;
  foto: string | null;
  tests_completados: number;
  nota_media: number | null;
  ultimo_acceso: string | null;
};

export function StudentList() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/alumnos`);
      const data = await res.json();
      setAlumnos(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar los alumnos");
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (alumno: Alumno) => {
    setToggling(alumno.id_persona);
    try {
      const res = await fetch(`${API_URL}/api/alumnos/${alumno.id_persona}/activo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !alumno.activo }),
      });
      if (res.ok) {
        setAlumnos((prev) =>
          prev.map((a) =>
            a.id_persona === alumno.id_persona ? { ...a, activo: alumno.activo ? 0 : 1 } : a
          )
        );
        toast.success(alumno.activo ? "Alumno desactivado" : "Alumno activado");
      } else {
        toast.error("Error al actualizar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setToggling(null);
    }
  };

  const alumnosFiltrados = alumnos.filter((a) => {
    const q = busqueda.toLowerCase();
    return (
      a.nombre.toLowerCase().includes(q) ||
      a.apellido1.toLowerCase().includes(q) ||
      a.correo.toLowerCase().includes(q) ||
      (a.dni && a.dni.toLowerCase().includes(q))
    );
  });

  const totalActivos = alumnos.filter((a) => a.activo).length;
  const notaMediaGlobal =
    alumnos.length > 0
      ? alumnos
          .filter((a) => a.nota_media !== null)
          .reduce((acc, a) => acc + Number(a.nota_media ?? 0), 0) /
          (alumnos.filter((a) => a.nota_media !== null).length || 1)
      : 0;

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lista de Alumnos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{alumnos.length} alumnos registrados</p>
        </div>
        <Link
          to="/registrar-alumno"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Nuevo alumno
        </Link>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-xl text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Alumnos Activos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalActivos} / {alumnos.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-xl text-green-600">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Nota Media Global</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {notaMediaGlobal > 0 ? notaMediaGlobal.toFixed(2) : "—"}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-xl text-purple-600">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tests Completados</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {alumnos.reduce((acc, a) => acc + Number(a.tests_completados ?? 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, correo o DNI..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {alumnosFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No hay alumnos que coincidan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 dark:text-gray-400">Alumno</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 hidden md:table-cell">DNI</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 hidden lg:table-cell">Tests</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 hidden lg:table-cell">Nota Media</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 hidden xl:table-cell">Último test</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-500 dark:text-gray-400">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {alumnosFiltrados.map((alumno) => {
                  const nombreCompleto = `${alumno.nombre} ${alumno.apellido1}${alumno.apellido2 ? ` ${alumno.apellido2}` : ""}`;
                  const notaMedia = Number(alumno.nota_media ?? 0);
                  const aprobado = notaMedia >= 5;

                  return (
                    <tr key={alumno.id_persona} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      {/* Alumno */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 overflow-hidden">
                            {alumno.foto ? (
                              <img src={alumno.foto} alt={nombreCompleto} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                {alumno.nombre[0]}{alumno.apellido1[0]}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{nombreCompleto}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{alumno.correo}</p>
                          </div>
                        </div>
                      </td>

                      {/* DNI */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{alumno.dni}</span>
                      </td>

                      {/* Tests */}
                      <td className="px-5 py-4 text-center hidden lg:table-cell">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {alumno.tests_completados ?? 0}
                        </span>
                      </td>

                      {/* Nota media */}
                      <td className="px-5 py-4 text-center hidden lg:table-cell">
                        {notaMedia > 0 ? (
                          <span className={`inline-block font-bold px-2 py-0.5 rounded-lg text-xs ${aprobado ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}>
                            {notaMedia.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>

                      {/* Último acceso */}
                      <td className="px-5 py-4 hidden xl:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          {formatFecha(alumno.ultimo_acceso)}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => toggleActivo(alumno)}
                          disabled={toggling === alumno.id_persona}
                          title={alumno.activo ? "Desactivar alumno" : "Activar alumno"}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                          style={{
                            background: alumno.activo ? "rgb(220 252 231 / 0.8)" : "rgb(254 226 226 / 0.8)",
                            color: alumno.activo ? "#15803d" : "#dc2626",
                          }}
                        >
                          {toggling === alumno.id_persona ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : alumno.activo ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {alumno.activo ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
