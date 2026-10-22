import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const FanContext = createContext(null);

export function FanProvider({ children }) {
  const [fan, setFan] = useState(null); // null = verificare, false = neautentificat, object = logat

  const checkAuth = useCallback(async () => {
    try {
      const r = await api.get("/fans/me");
      setFan(r.data);
    } catch (e) {
      setFan(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: la întoarcerea din OAuth, AuthCallback face schimbul de sesiune primul
    if (window.location.hash?.includes("session_id=")) {
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    await api.post("/fans/logout").catch(() => {});
    localStorage.removeItem("bioxic_fan_token");
    setFan(false);
  }, []);

  return (
    <FanContext.Provider value={{ fan, setFan, logout, refresh: checkAuth }}>
      {children}
    </FanContext.Provider>
  );
}

export function useFan() {
  return useContext(FanContext);
}
