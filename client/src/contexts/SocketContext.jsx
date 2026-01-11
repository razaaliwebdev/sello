import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "../redux/config";
import toast from "react-hot-toast";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    // Clean up existing socket if any
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.close();
    }

    const newSocket = io(SOCKET_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 3,
      timeout: 10000,
    });

    newSocket.on("connect", () => {
      console.log("🔌 Socket connected successfully!");
      setSocketConnected(true);
      newSocket.emit("join-chats");
      newSocket.emit("join-notifications");
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
      setSocketConnected(false);

      if (reason === "io server disconnect") {
        // Server disconnected, reconnect manually
        newSocket.connect();
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setSocketConnected(false);

      // Show user-friendly error message only once per session
      if (!sessionStorage.getItem("socketErrorShown")) {
        toast.error("Connection error. Real-time features may be limited.", {
          duration: 5000,
          position: "bottom-right",
        });
        sessionStorage.setItem("socketErrorShown", "true");
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.close();
      }
    };
  }, [token]);

  // Centralized event listener management
  const addEventListener = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      listenersRef.current.set(event, callback);
    }
  };

  const removeEventListener = (event) => {
    if (socketRef.current && listenersRef.current.has(event)) {
      socketRef.current.off(event, listenersRef.current.get(event));
      listenersRef.current.delete(event);
    }
  };

  const emit = (event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const joinChat = (chatId) => {
    emit("join-chat", chatId);
  };

  const sendMessage = (data) => {
    emit("send-message", data);
  };

  // Handle new notifications globally
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      toast.success(data.message || data.title || "New notification", {
        icon: "🔔",
        duration: 7000,
        position: "bottom-right",
      });
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [socket]);

  const value = {
    socket,
    socketConnected,
    addEventListener,
    removeEventListener,
    emit,
    joinChat,
    sendMessage,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketContext;
