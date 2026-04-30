import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, Paperclip, MoreVertical, Search, CheckCircle2, MessageSquare } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'teacher';
  time: string;
}

const teachers: any[] = [];

export function Chat() {
  const [activeTeacher, setActiveTeacher] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");

    // Simulate teacher response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "Entiendo. Dame un momento que te busco una sentencia reciente que aclara ese punto para el examen de Cáceres.",
        sender: 'teacher',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2000);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar (Teachers) */}
      <div className="w-full lg:w-80 border-r border-gray-200 flex flex-col bg-gray-50 flex-shrink-0">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tutores</h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar profesor o materia..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {teachers.map(teacher => (
            <div 
              key={teacher.id}
              onClick={() => setActiveTeacher(teacher)}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100 last:border-0 ${activeTeacher.id === teacher.id ? 'bg-blue-50' : 'hover:bg-gray-100 bg-white'}`}
            >
              <div className="relative">
                <img src={teacher.img} alt={teacher.name} className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-200" />
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${teacher.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 truncate">{teacher.name}</h4>
                <p className="text-xs text-gray-500 truncate">{teacher.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {activeTeacher ? (
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Chat Header */}
          <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
            <div className="flex items-center gap-3">
              <img src={activeTeacher.img} alt={activeTeacher.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">{activeTeacher.name}</h3>
                <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> En línea
                </p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'20\\' height=\\'20\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'%23f3f4f6\\' fill-opacity=\\'0.4\\' fill-rule=\\'evenodd\\'%3E%3Ccircle cx=\\'3\\' cy=\\'3\\' r=\\'3\\'/%3E%3Ccircle cx=\\'13\\' cy=\\'13\\' r=\\'3\\'/%3E%3C/g%3E%3C/svg%3E')" }}>
            <div className="text-center">
              <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full font-medium shadow-sm">Hoy</span>
            </div>
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed">{msg.text}</p>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 px-1">
                  <span>{msg.time}</span>
                  {msg.sender === 'user' && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <div className="flex gap-1">
                <button type="button" className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button type="button" className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 bg-gray-100 rounded-2xl flex items-center pr-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all border border-transparent focus-within:border-blue-300">
                <input 
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Escribe tu duda al profesor..."
                  className="w-full bg-transparent border-none py-3 px-4 focus:ring-0 text-[15px] text-gray-800"
                />
                <button 
                  type="submit" 
                  disabled={!inputMessage.trim()}
                  className={`p-2 rounded-xl flex items-center justify-center transition-all ${inputMessage.trim() ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500 border-l border-gray-200">
          <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-900">No hay profesores disponibles</p>
          <p className="text-sm mt-2 text-gray-500">Los profesores se añadirán próximamente.</p>
        </div>
      )}
    </div>
  );
}
