import React, { useEffect, useRef, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { PlayerProvider } from "@/context/PlayerContext";
import { FanProvider, useFan } from "@/context/FanContext";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PlayerBar from "@/components/PlayerBar";
import Snowfall from "@/components/Snowfall";
import Trees from "@/components/Trees";
import WinterIntro from "@/components/WinterIntro";
import NewVideoWatcher from "@/components/NewVideoWatcher";
import Home from "@/pages/Home";
import Muzica from "@/pages/Muzica";
import Live from "@/pages/Live";
import Videoclipuri from "@/pages/Videoclipuri";
import Despre from "@/pages/Despre";
import Contact from "@/pages/Contact";
import Cont from "@/pages/Cont";
import Gaming from "@/pages/Gaming";
import FanProfile from "@/pages/FanProfile";
import Admin from "@/pages/Admin";

function useEasterEgg() {
  const buffer = useRef("");
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      buffer.current = (buffer.current + e.key.toLowerCase()).slice(-6);
      if (buffer.current === "bioxic") {
        buffer.current = "";
        const el = document.getElementById("infection-overlay");
        if (el) {
          el.classList.remove("screen-infect");
          void el.offsetWidth;
          el.classList.add("screen-infect");
        }
        toast.success("MOD BIOXIC ACTIVAT", { description: "Tot ecranul a trecut pe verde." });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}

function VisitTracker() {
  useEffect(() => {
    let sid = sessionStorage.getItem("bioxic_sid");
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("bioxic_sid", sid);
      api.post("/visit", { sid }).catch(() => {});
    }
  }, []);
  return null;
}

function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const processed = useRef(false);
  const { refresh } = useFan();

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const sid = new URLSearchParams(location.hash.slice(1)).get("session_id");
    if (!sid) { navigate("/cont", { replace: true }); return; }
    api.post("/auth/google/session", { session_id: sid })
      .then((r) => {
        toast.success(`Salut, ${r.data.user.name}!`, { description: "Ești autentificat cu Google." });
        window.history.replaceState(null, "", "/cont");
        refresh().finally(() => navigate("/cont", { replace: true }));
      })
      .catch(() => {
        toast.error("Autentificarea Google a eșuat. Încearcă din nou.");
        navigate("/cont", { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" data-testid="auth-callback">
      <p className="font-display text-[#f3c46a] uppercase tracking-[0.3em] text-sm animate-pulse">Se finalizează autentificarea...</p>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  // detectare sincronă session_id (înainte de orice rută protejată)
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/muzica" element={<Muzica />} />
      <Route path="/live" element={<Live />} />
      <Route path="/videoclipuri" element={<Videoclipuri />} />
      <Route path="/despre" element={<Despre />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/cont" element={<Cont />} />
      <Route path="/gaming" element={<Gaming />} />
      <Route path="/fan/:userId" element={<FanProfile />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

function App() {
  useEasterEgg();

  return (
    <div className="App min-h-screen bg-[#06110d] text-white">
      <BrowserRouter>
        <FanProvider>
        <PlayerProvider>
          <VisitTracker />
          <div className="sky-bg" />
          <Trees />
          <Snowfall />
          <div className="grain-overlay" />
          <div id="infection-overlay" className="fixed inset-0 z-[98] pointer-events-none" />
          <WinterIntro />
          <NewVideoWatcher />
          <Navbar />
          <main className="relative z-10">
            <AppRoutes />
          </main>
          <Footer />
          <PlayerBar />
          <Toaster theme="dark" position="top-center" toastOptions={{ style: { background: "#0a120a", border: "1px solid rgba(243,196,106,0.3)", color: "#fff" } }} />
        </PlayerProvider>
        </FanProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
