import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const FanContext = createContext(null);

export function FanProvider({ children }) {
  const [me, setMe] = useState(null); // null = verificare, false = nelogat, obiect = logat
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    // CRITICAL: dacă revenim din OAuth, AuthCallback face schimbul de sesiune — sărim verificarea
    if (window.location.hash?.includes("session_id=")) return;
    api.get("/fans/me").then((r) => setMe(r.data)).catch(() => setMe(false));
  }, []);

  const loginGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const loginEmail = async (email, password) => {
    const r = await api.post("/fans/login", { email, password });
    setMe(r.data.user);
  };

  const registerEmail = async (name, email, password) => {
    const r = await api.post("/fans/register", { name, email, password });
    setMe(r.data.user);
  };

  const logout = async () => {
    await api.post("/fans/logout").catch(() => {});
    setMe(false);
  };

  return (
    <FanContext.Provider value={{ me, setMe, loginOpen, setLoginOpen, loginGoogle, loginEmail, registerEmail, logout }}>
      {children}
    </FanContext.Provider>
  );
}

export function useFan() {
  return useContext(FanContext);
}
