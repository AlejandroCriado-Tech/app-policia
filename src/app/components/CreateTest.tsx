import { useState, useRef } from 'react';
import { PlusCircle, Trash2, Save, FileText, UploadCloud, Wand2, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

const mockExtractedQuestions: Question[] = [
  { text: "¿En qué año se aprobó la Constitución Española?", options: ["1975", "1978", "1982", "1986"], correctIndex: 1 },
  { text: "Según el Estatuto de Autonomía de Extremadura, la capital de la comunidad autónoma es:", options: ["Cáceres", "Badajoz", "Mérida", "Plasencia"], correctIndex: 2 },
  { text: "¿Quién es el Jefe del Estado según la Constitución Española?", options: ["El Presidente del Gobierno", "El Rey", "El Ministro de Justicia", "El Presidente del Tribunal Supremo"], correctIndex: 1 },
  { text: "¿Qué artículo consagra el derecho a la vida y a la integridad física y moral?", options: ["Artículo 14", "Artículo 15", "Artículo 16", "Artículo 17"], correctIndex: 1 }
];

export function CreateTest() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Legislación');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', options: ['', '', '', ''], correctIndex: 0 }
  ]);
  
  // PDF Import State
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctIndex: 0 }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error('El test debe tener al menos una pregunta');
      return;
    }
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index: number, field: 'text' | 'correctIndex', value: string | number) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[optIndex] = value;
    setQuestions(newQuestions);
  };

  // PDF Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error("Por favor, sube un archivo en formato PDF");
      return;
    }

    setIsImporting(true);
    
    // Simulamos el tiempo de procesamiento de la IA (backend)
    setTimeout(() => {
      setIsImporting(false);
      setQuestions(mockExtractedQuestions);
      setTitle(`Test extraído de: ${file.name.replace('.pdf', '')}`);
      toast.success("¡PDF procesado! Se han extraído 4 preguntas con éxito.");
    }, 3000);
  };

  const handleSaveTest = () => {
    if (!title.trim()) {
      toast.error('Por favor, introduce un título para el test');
      return;
    }
    
    const isValid = questions.every(q => 
      q.text.trim() && q.options.every(o => o.trim())
    );

    if (!isValid) {
      toast.error('Por favor, rellena todos los campos de las preguntas y opciones');
      return;
    }

    toast.success('¡Test guardado correctamente!');
    
    setTimeout(() => {
      navigate('/tests');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Crear Nuevo Test</h2>
        <p className="text-gray-500">Añade material de estudio para los alumnos</p>
      </div>

      {/* IA Import PDF Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-1">
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Wand2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-900">Importar preguntas con Inteligencia Artificial</h3>
              <p className="text-sm text-indigo-700">Sube tu PDF con exámenes antiguos y nosotros extraemos las preguntas y opciones automáticamente.</p>
            </div>
          </div>

          <div 
            className={`mt-4 border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-indigo-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {isImporting ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <div className="space-y-1">
                  <p className="text-indigo-900 font-medium">La IA está analizando tu documento...</p>
                  <p className="text-indigo-600 text-sm">Extrayendo preguntas y detectando opciones correctas</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-indigo-900 font-medium mb-1">Arrastra tu PDF aquí o haz clic para subirlo</p>
                  <p className="text-indigo-500 text-sm">Soporta formato .PDF (Máx. 10MB)</p>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Seleccionar archivo PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Metadata */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" /> Detalles del Test
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título del Test</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Simulacro Constitución Título I"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
            >
              <option value="Legislación">Legislación</option>
              <option value="Derecho Penal">Derecho Penal</option>
              <option value="Normativa Local">Normativa Local (Cáceres)</option>
              <option value="Simulacro General">Simulacro General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Preguntas</h3>
          <span className="text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Total: {questions.length}
          </span>
        </div>

        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative group">
            <button
              onClick={() => handleRemoveQuestion(qIndex)}
              className="absolute top-4 right-4 p-2 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Eliminar pregunta"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <div className="mb-6 pr-12">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Pregunta {qIndex + 1}
              </label>
              <textarea
                value={q.text}
                onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                placeholder="Escribe el enunciado de la pregunta..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors resize-none h-20"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Opciones (Marca la correcta)</label>
              {q.options.map((opt, optIndex) => (
                <div key={optIndex} className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${q.correctIndex === optIndex ? 'border-green-400 bg-green-50 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={q.correctIndex === optIndex}
                    onChange={() => handleQuestionChange(qIndex, 'correctIndex', optIndex)}
                    className="w-5 h-5 text-green-600 focus:ring-green-500 border-gray-300 ml-2 cursor-pointer"
                  />
                  <div className="flex-1 flex items-center gap-2">
                    <span className={`font-bold w-6 text-center ${q.correctIndex === optIndex ? 'text-green-700' : 'text-gray-400'}`}>
                      {['A', 'B', 'C', 'D'][optIndex]}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                      placeholder={`Opción ${['A', 'B', 'C', 'D'][optIndex]}`}
                      className={`flex-1 px-3 py-2 border rounded-md transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        q.correctIndex === optIndex 
                          ? 'border-green-200 bg-white text-green-900' 
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-gray-50/90 backdrop-blur-md p-4 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
        <button
          onClick={handleAddQuestion}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium"
        >
          <PlusCircle className="w-5 h-5" /> Añadir Pregunta Manual
        </button>

        <button
          onClick={handleSaveTest}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors font-bold"
        >
          <Save className="w-5 h-5" /> Guardar y Publicar Test
        </button>
      </div>
    </div>
  );
}
