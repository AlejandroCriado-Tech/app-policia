import { FileText, Download, PlayCircle, Clock } from "lucide-react";
import { useState } from "react";

const syllabusData: any[] = [];

export function Syllabi() {
  const [activeTab, setActiveTab] = useState('todos');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Temarios</h2>
          <p className="text-gray-500 dark:text-gray-400">Material de estudio para la Oposición a Policía Local (Cáceres)</p>
        </div>

        <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'todos' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab('todos')}
          >
            Todos los bloques
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'completados' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab('completados')}
          >
            Completados
          </button>
        </div>
      </div>

      {syllabusData.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No hay temarios disponibles</h3>
          <p className="text-gray-500 dark:text-gray-400">El material de estudio se añadirá próximamente.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {syllabusData.map((block) => (
            <div key={block.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{block.title}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${block.progress}%` }}></div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{block.progress}% completado</span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {block.topics.map((topic: any) => (
                  <div key={topic.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${topic.completed ? 'bg-green-100 dark:bg-green-900/40 text-green-600' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-500'}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`font-medium ${topic.completed ? 'text-gray-900 dark:text-gray-400 line-through decoration-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {topic.name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>{topic.duration} estimados</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Ver Videoclase">
                        <PlayCircle className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Descargar PDF">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}