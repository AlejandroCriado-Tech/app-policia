import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

import { API_URL as API } from '../lib/api';

interface ChatContextType {
  socketRef: React.MutableRefObject<Socket | null>;
  totalNoLeidos: number;
  clearNotifications: () => void;
}

const ChatContext = createContext<ChatContextType>({
  socketRef: { current: null },
  totalNoLeidos: 0,
  clearNotifications: () => {},
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [totalNoLeidos, setTotalNoLeidos] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setTotalNoLeidos(0);
      return;
    }

    const socket = io(API, { auth: { token: user.token } });
    socketRef.current = socket;

    // Cargar no-leídos iniciales desde la BD
    fetch(`${API}/api/chat/conversaciones/${user.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((convs: { no_leidos?: number }[]) => {
        const total = convs.reduce((s, c) => s + (c.no_leidos || 0), 0);
        setTotalNoLeidos(total);
      })
      .catch(() => {});

    const handleNotification = () => setTotalNoLeidos((n) => n + 1);
    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const clearNotifications = () => setTotalNoLeidos(0);

  return (
    <ChatContext.Provider value={{ socketRef, totalNoLeidos, clearNotifications }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChatContext = () => useContext(ChatContext);
