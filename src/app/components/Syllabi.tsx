import { BookOpen, ChevronRight, Eye, FileText, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

type Pdf = {
  id_pdf: number;
  pdf_path: string;
  pdf_nombre: string;
};

type Tema = {
  id_tema: number;
  numero: number;
  bloque: number;
  titulo: string;
  descripcion: string;
  pdfs: Pdf[];
};

const BLOQUES = [
  { id: 1, nombre: "Parte General", color: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" } },
  { id: 2, nombre: "Parte Específica", color: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-800" } },
];

import { API_URL as API } from '../lib/api';

export function Syllabi() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [temas, setTemas] = useState<Tema[]>([]);
  const [cargando, setCargando] = useState(true);
  const [bloqueAbierto, setBloqueAbierto] = useState<number | null>(null);
  const [temaExpandido, setTemaExpandido] = useState<number | null>(null);
  const [subiendo, setSubiendo] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch(`${API}/api/temas`)
      .then(r => r.json())
      .then(data => { setTemas(data); setCargando(false); })
      .catch(() => setCargando(false));
  }, []);

  const temasDeBloque = (bloqueId: number) => temas.filter(t => t.bloque === bloqueId);

  const subirPdf = async (idTema: number, file: File) => {
    setSubiendo(idTema);
    const fd = new FormData();
    fd.append('pdf', file);
    try {
      const r = await fetch(`${API}/api/temas/${idTema}/pdf`, { method: 'POST', body: fd });
      const data = await r.json();
      if (data.ok) {
        setTemas(prev => prev.map(t =>
          t.id_tema === idTema
            ? { ...t, pdfs: [...t.pdfs, { id_pdf: data.id_pdf, pdf_path: data.pdf_path, pdf_nombre: data.pdf_nombre }] }
            : t
        ));
      }
    } finally {
      setSubiendo(null);
    }
  };

  const eliminarPdf = async (idTema: number, idPdf: number) => {
    setEliminando(idPdf);
    try {
      await fetch(`${API}/api/temas/pdf/${idPdf}`, { method: 'DELETE' });
      setTemas(prev => prev.map(t =>
        t.id_tema === idTema ? { ...t, pdfs: t.pdfs.filter(p => p.id_pdf !== idPdf) } : t
      ));
    } finally {
      setEliminando(null);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500">
        Cargando temarios...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Temarios</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Agente de Policía Local · Orden 30 de junio de 2025 · 41 temas
        </p>
      </div>

      <div className="space-y-3">
        {BLOQUES.map((bloque) => {
          const abierto = bloqueAbierto === bloque.id;
          const temasBloque = temasDeBloque(bloque.id);
          const totalPdfs = temasBloque.reduce((acc, t) => acc + t.pdfs.length, 0);

          return (
            <div key={bloque.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <button
                onClick={() => { setBloqueAbierto(abierto ? null : bloque.id); setTemaExpandido(null); }}
                className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className={`w-10 h-10 ${bloque.color.bg} ${bloque.color.text} rounded-xl flex items-center justify-center shrink-0`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-900 dark:text-white text-base">{bloque.nombre}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {temasBloque.length} temas · {totalPdfs} {totalPdfs === 1 ? 'documento' : 'documentos'}
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${abierto ? 'rotate-90' : ''}`} />
              </button>

              {abierto && (
                <div className="border-t border-gray-100 dark:border-gray-700">
                  {temasBloque.map((tema) => {
                    const expandido = temaExpandido === tema.numero;
                    return (
                      <div key={tema.numero} className={`border-b border-gray-50 dark:border-gray-700/50 last:border-b-0 ${expandido ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'} transition-colors`}>

                        {/* Fila del tema */}
                        <div
                          className="flex items-start gap-4 px-6 py-4 cursor-pointer"
                          onClick={() => setTemaExpandido(expandido ? null : tema.numero)}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 transition-colors ${expandido ? `${bloque.color.bg} ${bloque.color.text}` : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                            {tema.numero}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-base leading-snug transition-colors ${expandido ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              Tema {tema.numero}. {tema.titulo}
                            </p>
                            {tema.pdfs.length > 0 && !expandido && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {tema.pdfs.length} {tema.pdfs.length === 1 ? 'documento' : 'documentos'}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 mt-0.5">
                            {tema.pdfs.length > 0 && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bloque.color.bg} ${bloque.color.text}`}>
                                {tema.pdfs.length} PDF{tema.pdfs.length > 1 ? 's' : ''}
                              </span>
                            )}
                            <FileText className={`w-4 h-4 transition-colors ${expandido ? bloque.color.text : 'text-gray-300 dark:text-gray-600'}`} />
                          </div>
                        </div>

                        {/* Panel expandido */}
                        {expandido && (
                          <div className="px-6 pb-5 space-y-4" onClick={e => e.stopPropagation()}>
                            {/* Descripción */}
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                              {tema.descripcion}
                            </p>

                            {/* Lista de PDFs */}
                            {tema.pdfs.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                  Documentos
                                </p>
                                <div className="space-y-1.5">
                                  {tema.pdfs.map(pdf => (
                                    <div
                                      key={pdf.id_pdf}
                                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                      <FileText className={`w-4 h-4 shrink-0 ${bloque.color.text}`} />
                                      <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 break-all">
                                        {pdf.pdf_nombre}
                                      </span>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <a
                                          href={`${API}/uploads/temas/${pdf.pdf_path}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md ${bloque.color.bg} ${bloque.color.text} hover:opacity-80 transition-opacity`}
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          Ver
                                        </a>
                                        {isAdmin && (
                                          <button
                                            onClick={() => eliminarPdf(tema.id_tema, pdf.id_pdf)}
                                            disabled={eliminando === pdf.id_pdf}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-40 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            {eliminando === pdf.id_pdf ? '...' : 'Eliminar'}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Botón añadir PDF (solo admin) / mensaje sin contenido (alumno) */}
                            {isAdmin ? (
                              <div>
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  className="hidden"
                                  ref={el => { fileRefs.current[tema.id_tema] = el; }}
                                  onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (f) subirPdf(tema.id_tema, f);
                                    e.target.value = '';
                                  }}
                                />
                                <button
                                  onClick={() => fileRefs.current[tema.id_tema]?.click()}
                                  disabled={subiendo === tema.id_tema}
                                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  {subiendo === tema.id_tema ? 'Subiendo...' : 'Añadir PDF'}
                                </button>
                              </div>
                            ) : (
                              tema.pdfs.length === 0 && (
                                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                                  Sin contenido todavía
                                </p>
                              )
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
    </div>
  );
}
