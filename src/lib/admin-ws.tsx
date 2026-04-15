"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { getToken } from "@/lib/auth";

const WS_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws") ?? "ws://localhost:3001";

export type WSEvent =
  | { type: "new_request"; data: Record<string, unknown> }
  | { type: "request_updated"; data: { id: string; status: string } }
  | { type: "stats_refresh" }
  | { type: "plans_updated" }
  | { type: "connected" };

type AdminWSContextType = {
  connected: boolean;
  lastEvent: WSEvent | null;
};

const AdminWSContext = createContext<AdminWSContextType>({ connected: false, lastEvent: null });

export function AdminWSProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);

  const connect = useCallback(() => {
    const token = getToken();
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}/api/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retryCount.current = 0;
      setLastEvent({ type: "connected" });
    };

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as WSEvent;
        setLastEvent(event);
      } catch {}
    };

    ws.onclose = (e) => {
      setConnected(false);
      wsRef.current = null;
      // 4001 = ruxsat yo'q, qayta ulanmaymiz
      if (e.code === 4001) return;
      // Eksponensial qayta ulanish (max 30s)
      const delay = Math.min(1000 * 2 ** retryCount.current, 30000);
      retryCount.current++;
      retryRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => { ws.close(); };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      retryRef.current && clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return (
    <AdminWSContext.Provider value={{ connected, lastEvent }}>
      {children}
    </AdminWSContext.Provider>
  );
}

export function useAdminWS() {
  return useContext(AdminWSContext);
}
