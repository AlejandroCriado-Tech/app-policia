import { useState, useRef, useEffect } from "react";
import { Send, Search, CheckCircle2, MessageSquare } from "lucide-react";
import { Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useChatContext } from "../context/ChatContext";

import { API_URL as API } from '../lib/api';

interface Contacto {
  id_persona: number;
  nombre: string;
  apellido1?: string;
  foto?: string | null;
  ultimo_mensaje?: string;
  ultima_fecha?: string;
  no_leidos?: number;
}

interface Mensaje {
  id_mensaje: number;
  id_emisor: number;
  id_receptor: number;
  mensaje: string;
  leido: number;
  created_at: string;
}

export function Chat() {
  const { user } = useAuth();
  const { socketRef, clearNotifications } = useChatContext();
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [activo, setActivo] = useState<Contacto | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [noLeidos, setNoLeidos] = useState<Record<number, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localSocketRef = useRef<Socket | null>(null);
  const activoRef = useRef<Contacto | null>(null);

  // Mantener ref sincronizada con el estado activo
  useEffect(() => {
    activoRef.current = activo;
  }, [activo]);

  // Suscribirse a eventos del socket global al montar el chat
  useEffect(() => {
    if (!user) return;

    // Al entrar al chat, limpiar el badge global
    clearNotifications();

    const socket = socketRef.current;
    if (!socket) return;
    localSocketRef.current = socket;

    const handleOnlineUsers = (ids: number[]) => setOnlineUsers(new Set(ids));
    const handleUserOnline = (id: number) => setOnlineUsers((prev) => new Set([...prev, id]));
    const handleUserOffline = (id: number) => setOnlineUsers((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    const handleNewMessage = (msg: Mensaje) => {
      const otroId = msg.id_emisor === user.id ? msg.id_receptor : msg.id_emisor;
      if (activoRef.current?.id_persona === otroId) {
        setMensajes((prev) => {
          if (prev.find((m) => m.id_mensaje === msg.id_mensaje)) return prev;
          return [...prev, msg];
        });
      }
      setContactos((prev) =>
        prev.map((c) =>
          c.id_persona === otroId
            ? { ...c, ultimo_mensaje: msg.mensaje, ultima_fecha: msg.created_at }
            : c
        )
      );
    };
    const handleNotification = ({ id_emisor }: { id_emisor: number }) => {
      if (activoRef.current?.id_persona !== id_emisor) {
        setNoLeidos((prev) => ({ ...prev, [id_emisor]: (prev[id_emisor] || 0) + 1 }));
      }
    };

    socket.on("online_users", handleOnlineUsers);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("new_message", handleNewMessage);
    socket.on("notification", handleNotification);

    // Solicitar lista de online al reentrar
    socket.emit("get_online_users");

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("new_message", handleNewMessage);
      socket.off("notification", handleNotification);
    };
  }, [user, socketRef.current]);

  // Cargar contactos al montar
  useEffect(() => {
    if (!user) return;
    cargarContactos();
  }, [user]);

  const cargarContactos = async () => {
    if (!user) return;
    try {
      const convRes = await fetch(`${API}/api/chat/conversaciones/${user.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const conversaciones: Contacto[] = await convRes.json();

      // Inicializar badges de no leídos
      const badges: Record<number, number> = {};
      conversaciones.forEach((c) => {
        if (c.no_leidos) badges[c.id_persona] = c.no_leidos;
      });
      setNoLeidos(badges);

      if (user.role === "student") {
        // Alumnos: mostrar siempre todos los profesores (con o sin historial)
        const profRes = await fetch(`${API}/api/chat/profesores`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const profesores: Contacto[] = await profRes.json();

        const convMap = new Map(conversaciones.map((c) => [c.id_persona, c]));
        const merged = profesores.map((p) => convMap.get(p.id_persona) ?? p);
        setContactos(merged);
      } else {
        // Admin: mostrar alumnos que han iniciado conversación
        setContactos(conversaciones);
      }
    } catch (err) {
      console.error("Error cargando contactos:", err);
    }
  };

  const seleccionarContacto = async (contacto: Contacto) => {
    setActivo(contacto);
    setMensajes([]);

    // Unirse a la sala de la conversación
    localSocketRef.current?.emit("join_room", { id_otro: contacto.id_persona });

    // Marcar como leídos
    localSocketRef.current?.emit("mark_read", { id_emisor: contacto.id_persona });
    setNoLeidos((prev) => ({ ...prev, [contacto.id_persona]: 0 }));

    // Cargar historial
    try {
      const res = await fetch(
        `${API}/api/chat/mensajes/${user!.id}/${contacto.id_persona}`,
        { headers: { Authorization: `Bearer ${user!.token}` } }
      );
      const data = await res.json();
      setMensajes(data);
    } catch (err) {
      console.error("Error cargando mensajes:", err);
    }
  };

  const enviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activo || !localSocketRef.current) return;
    localSocketRef.current.emit("send_message", {
      id_receptor: activo.id_persona,
      mensaje: input.trim(),
    });
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const contactosFiltrados = contactos.filter((c) => {
    const nombre = `${c.nombre} ${c.apellido1 || ""}`.toLowerCase();
    return nombre.includes(busqueda.toLowerCase());
  });

  const fmtHora = (d: string) =>
    new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  const fmtFecha = (d: string) => {
    if (!d) return "";
    const fecha = new Date(d);
    const hoy = new Date();
    if (fecha.toDateString() === hoy.toDateString()) return fmtHora(d);
    return fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
  };

  const fmtDiaCompleto = (d: string) =>
    new Date(d).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  const fotoSrc = (foto: string | null | undefined) => {
    if (!foto) return null;
    if (foto.startsWith("data:") || foto.startsWith("http")) return foto;
    return `${API}${foto}`;
  };

  const Avatar = ({ p, size = 12 }: { p: Contacto; size?: number }) =>
    fotoSrc(p.foto) ? (
      <img
        src={fotoSrc(p.foto)!}
        alt={p.nombre}
        className={`w-${size} h-${size} rounded-full object-cover border border-gray-200 dark:border-gray-600`}
      />
    ) : (
      <div
        className={`w-${size} h-${size} rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-gray-200 dark:border-gray-600`}
        style={{ fontSize: size * 1.6 }}
      >
        {p.nombre[0]}
        {p.apellido1?.[0] ?? ""}
      </div>
    );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

      {/* Barra lateral */}
      <div className="w-full lg:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-900 flex-shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {user?.role === "student" ? "Tutores" : "Alumnos"}
          </h2>
          <div className="relative">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contactosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-6 text-center">
              <MessageSquare className="w-10 h-10 mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">
                {user?.role === "student"
                  ? "No hay tutores disponibles"
                  : "Sin conversaciones aún"}
              </p>
            </div>
          ) : (
            contactosFiltrados.map((c) => (
              <div
                key={c.id_persona}
                onClick={() => seleccionarContacto(c)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                  activo?.id_persona === c.id_persona
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar p={c} size={12} />
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                      onlineUsers.has(c.id_persona) ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {c.nombre} {c.apellido1 ?? ""}
                    </h4>
                    {c.ultima_fecha && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                        {fmtFecha(c.ultima_fecha)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {c.ultimo_mensaje ?? "Iniciar conversación"}
                    </p>
                    {(noLeidos[c.id_persona] ?? 0) > 0 && (
                      <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 font-bold">
                        {noLeidos[c.id_persona]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área de chat */}
      {activo ? (
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-800">
          {/* Cabecera */}
          <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center px-6 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <Avatar p={activo} size={10} />
                <div
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${
                    onlineUsers.has(activo.id_persona) ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                  {activo.nombre} {activo.apellido1 ?? ""}
                </h3>
                <p
                  className={`text-xs font-medium flex items-center gap-1 ${
                    onlineUsers.has(activo.id_persona)
                      ? "text-green-500"
                      : "text-gray-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      onlineUsers.has(activo.id_persona) ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  {onlineUsers.has(activo.id_persona) ? "En línea" : "Desconectado"}
                </p>
              </div>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
            {mensajes.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">Empieza la conversación</p>
              </div>
            )}

            {mensajes.map((msg, idx) => {
              const esPropio = msg.id_emisor === user!.id;
              const showDate =
                idx === 0 ||
                new Date(mensajes[idx - 1].created_at).toDateString() !==
                  new Date(msg.created_at).toDateString();

              return (
                <div key={msg.id_mensaje}>
                  {showDate && (
                    <div className="text-center my-2">
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full font-medium">
                        {fmtDiaCompleto(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex flex-col ${esPropio ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                        esPropio
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-tl-sm"
                      }`}
                    >
                      <p className="text-[15px] leading-relaxed">{msg.mensaje}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 px-1">
                      <span>{fmtHora(msg.created_at)}</span>
                      {esPropio && (
                        <CheckCircle2
                          className={`w-3 h-3 ${
                            msg.leido ? "text-blue-500" : "text-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={enviarMensaje} className="flex items-end gap-2">
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center pr-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white dark:focus-within:bg-gray-600 transition-all border border-transparent focus-within:border-blue-300">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    user?.role === "student"
                      ? "Escribe tu duda al tutor..."
                      : "Escribe un mensaje al alumno..."
                  }
                  className="w-full bg-transparent border-none py-3 px-4 focus:ring-0 text-[15px] text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                    input.trim()
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
          <MessageSquare className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            Selecciona una conversación
          </p>
          <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
            {user?.role === "student"
              ? "Elige un tutor para enviar tu duda"
              : "Elige un alumno para responder"}
          </p>
        </div>
      )}
    </div>
  );
}
