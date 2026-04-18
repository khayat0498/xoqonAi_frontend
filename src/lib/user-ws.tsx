"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { getToken } from "@/lib/auth";

const WS_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws") ?? "ws://localhost:3001";

export type UserWSEvent =
  | { type: "plan_updated"; data: { planKey: string; period: string; endsAt: string } }
  | { type: "usage_updated"; data: { used: number; limit: number; allowed: boolean } }
  | { type: "plans_updated" }
  | { type: "submission_done"; data: { id: string; grade: string | null; score: number | null; subject: string | null; failed?: boolean; studentId: string | null; classId: string | null } }
  | { type: "submission_processing"; data: { id: string; studentId: string | null; classId: string | null } }
  | { type: "balance_updated"; data: { balanceUzs: number; costUzs: number } }
  | { type: "connected" };

type UserWSContextType = {
  connected: boolean;
  lastEvent: UserWSEvent | null;
};

const UserWSContext = createContext<UserWSContextType>({ connected: false, lastEvent: null });

export function UserWSProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<UserWSEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);

  const connect = useCallback(() => {
    const token = getToken();
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}/api/user-ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retryCount.current = 0;
      setLastEvent({ type: "connected" });
    };

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as UserWSEvent;
        setLastEvent(event);
      } catch {}
    };

    ws.onclose = (e) => {
      setConnected(false);
      wsRef.current = null;
      if (e.code === 4001) return;
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
    <UserWSContext.Provider value={{ connected, lastEvent }}>
      {children}
    </UserWSContext.Provider>
  );
}

export function useUserWS() {
  return useContext(UserWSContext);
}
