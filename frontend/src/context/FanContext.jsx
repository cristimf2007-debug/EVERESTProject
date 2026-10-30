import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const FanContext = createContext(null);
const CACHE_KEY = "bioxic_me_cache";

// Sesiunea de fan: citită instant din cache (nu „dispare" la tranziții/reload), revalidată pe server
export function FanProvider({ children }) {
  const [me, setMeState] = useState(() => {
    try {
      const c = sessionStorage.getItem(CACHE_KEY);
      return c ? JSON.parse(c) : null; // null = verificare, false = nelogat, obiect = logat
    } catch { return null; }
  });
  const [loginOpen, setLoginOpen] = useState(false);

  const setMe = (u) => {
    setMeState(u);
    try {
      if (u && typeof u === "object") sessionStorage.setItem(CACHE_KEY, JSON.stringify(u));
      else sessionStorage.removeItem(CACHE_KEY);
    } catch { /* storage blocat */ }
  };

  useEffect(() => {
    // CRITICAL: dacă revenim din OAuth, AuthCallback face schimbul de sesiune — sărim verificarea
    if (window.location.hash?.includes("session_id=")) return;
    api.get("/fans/me").then((r) => setMe(r.data?.user_id ? r.data : false)).catch(() => setMe(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    // flow propriu (client Google al BIOXIC → consimțământul arată bioxic.ro);
    // serverul redirecționează spre serviciul găzduit până sunt configurate cheile proprii
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/google/start`;
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
