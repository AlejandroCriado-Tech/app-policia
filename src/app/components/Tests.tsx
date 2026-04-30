import { useState, useEffect } from "react";
import { CheckSquare, Clock, BarChart2, Zap, AlertCircle, PlayCircle, CheckCircle2, XCircle, ArrowRight, RotateCcw, PlusCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";

// Variables vacías para que el usuario añada los suyos propios
const testCategories: any[] = [];
const mockQuestions: any[] = [];

export function Tests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTest, setActiveTest] = useState<number | null>(null);
  
  // Test State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrected, setIsCorrected] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [testFinished, setTestFinished] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(45 * 60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTest && !testFinished && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTest, testFinished, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startTest = (id: number) => {
    setActiveTest(id);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsCorrected(false);
    setScore({ correct: 0, incorrect: 0 });
    setTestFinished(false);
    setTimeLeft(45 * 60);
  };

  const quitTest = () => {
    setActiveTest(null);
  };

  const handleCorrect = () => {
    if (selectedOption === null) return;
    setIsCorrected(true);
    
    const currentQuestion = mockQuestions[currentQuestionIndex];
    if (selectedOption === currentQuestion.correctIndex) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsCorrected(false);
    } else {
      setTestFinished(true);
    }
  };

  if (activeTest) {
    if (testFinished) {
      const totalQuestions = mockQuestions.length;
      const scorePercentage = Math.round((score.correct / totalQuestions) * 100);
      const isApproved = scorePercentage >= 50;

      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-2xl mx-auto mt-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-inner" style={{ backgroundColor: isApproved ? '#dcfce7' : '#fee2e2' }}>
            {isApproved ? (
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isApproved ? '¡Test Superado!' : 'Test Suspendido'}
          </h2>
          <p className="text-gray-500 mb-8">Has completado el test en {formatTime((45 * 60) - timeLeft)}</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-2xl font-bold text-blue-600">{scorePercentage}%</div>
              <div className="text-sm font-medium text-gray-500">Nota Final</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="text-2xl font-bold text-green-600">{score.correct}</div>
              <div className="text-sm font-medium text-green-700">Aciertos</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="text-2xl font-bold text-red-600">{score.incorrect}</div>
              <div className="text-sm font-medium text-red-700">Fallos</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => startTest(activeTest)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              <RotateCcw className="w-5 h-5" /> Repetir Test
            </button>
            <button 
              onClick={quitTest}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors"
            >
               Volver al Menú
            </button>
          </div>
        </div>
      );
    }

    const question = mockQuestions[currentQuestionIndex];

    if (!question) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center max-w-2xl mx-auto mt-8">
           <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
           <h3 className="text-xl font-bold text-gray-900 mb-2">Este test está vacío</h3>
           <p className="text-gray-500 mb-6">Aún no se han añadido preguntas a esta categoría.</p>
           <button 
              onClick={quitTest}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Volver atrás
            </button>
        </div>
      );
    }

    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-3xl mx-auto mt-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
              </span>
            </div>
            <div className="text-gray-500 font-medium">Pregunta {currentQuestionIndex + 1} de {mockQuestions.length}</div>
            <button 
              onClick={quitTest}
              className="text-gray-400 hover:text-red-500 font-medium transition-colors"
            >
              Abandonar
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentQuestionIndex) / mockQuestions.length) * 100}%` }}
            ></div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 leading-snug">
              {question.text}
            </h3>
            
            <div className="space-y-3">
              {question.options.map((option, idx) => {
                let optionClass = "border-gray-200 hover:bg-blue-50 hover:border-blue-300 bg-white";
                let icon = null;

                if (isCorrected) {
                  if (idx === question.correctIndex) {
                    optionClass = "border-green-500 bg-green-50 text-green-900 ring-1 ring-green-500";
                    icon = <CheckCircle2 className="w-6 h-6 text-green-500 ml-auto" />;
                  } else if (idx === selectedOption) {
                    optionClass = "border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500";
                    icon = <XCircle className="w-6 h-6 text-red-500 ml-auto" />;
                  } else {
                    optionClass = "border-gray-200 bg-gray-50 opacity-60";
                  }
                } else if (selectedOption === idx) {
                  optionClass = "border-blue-500 bg-blue-50 ring-2 ring-blue-500";
                }

                return (
                  <label 
                    key={idx} 
                    className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all group relative overflow-hidden ${optionClass} ${isCorrected ? 'cursor-default pointer-events-none' : ''}`}
                    onClick={() => !isCorrected && setSelectedOption(idx)}
                  >
                    {!isCorrected && (
                      <input 
                        type="radio" 
                        name="question" 
                        checked={selectedOption === idx}
                        onChange={() => {}}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300" 
                      />
                    )}
                    <span className={`font-medium ${isCorrected ? '' : 'ml-4'} ${selectedOption === idx && !isCorrected ? 'text-blue-900' : 'text-gray-700'}`}>
                      {option}
                    </span>
                    {icon}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Explanation Box */}
          {isCorrected && (
            <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-xl animate-in slide-in-from-top-4 fade-in duration-300">
              <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" /> Explicación:
              </h4>
              <p className="text-blue-800 text-sm leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-100">
            <div className="flex gap-2">
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Aciertos: {score.correct}</span>
              <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">Fallos: {score.incorrect}</span>
            </div>
            
            {!isCorrected ? (
              <button 
                onClick={handleCorrect}
                disabled={selectedOption === null}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                Corregir <Zap className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                {currentQuestionIndex < mockQuestions.length - 1 ? 'Siguiente Pregunta' : 'Finalizar Test'} <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard de tests
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tipo Test</h2>
          <p className="text-gray-500">Practica con los test de la academia</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => navigate('/crear-test')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" /> Crear Test
          </button>
        )}
      </div>

      {testCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center shadow-sm">
          <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay tests disponibles</h3>
          <p className="text-gray-500 mb-6">
            {user?.role === 'admin' 
              ? 'Empieza a añadir categorías y preguntas para tus alumnos.' 
              : 'El profesor aún no ha publicado ningún test. Vuelve más tarde.'}
          </p>
          {user?.role === 'admin' && (
            <button 
              onClick={() => navigate('/crear-test')}
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold py-3 px-8 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" /> Añadir el primer test
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {testCategories.map(cat => (
          <div key={cat.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer" onClick={() => startTest(cat.id)}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${cat.color}-500 opacity-5 rounded-bl-full transform translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className={`w-12 h-12 bg-${cat.color}-100 text-${cat.color}-600 rounded-xl flex items-center justify-center mb-4`}>
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{cat.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4 h-10">
              {cat.desc}
            </p>
            <button className={`w-full py-2 bg-${cat.color}-50 text-${cat.color}-700 font-semibold rounded-lg text-sm hover:bg-${cat.color}-100 transition-colors`}>
              Empezar ahora
            </button>
          </div>
        ))}
      </div>
      )}

      {/* Simulacro Destacado (Sólo si hay tests) */}
      {testCategories.length > 0 && (
        <div className="mt-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <BarChart2 className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-2">Simulacro Oficial Oposición Cáceres</h3>
            <p className="text-slate-300 mb-6">
              Prueba tus conocimientos con un examen basado en la última convocatoria de Policía Local de Cáceres (2025). 100 preguntas, 90 minutos.
            </p>
            
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                Penaliza 0.33 por fallo
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Clock className="w-4 h-4 text-blue-400" />
                90 min
              </div>
            </div>
          </div>
          
          <div className="flex justify-start md:justify-end">
            <button onClick={() => startTest(100)} className="bg-white text-slate-900 hover:bg-blue-50 font-bold py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-3">
              <PlayCircle className="w-6 h-6 text-blue-600" />
              Iniciar Simulacro Oficial
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
