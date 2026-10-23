import React, { useEffect, useRef, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { RadioProvider } from "@/context/RadioContext";
import { FanProvider, useFan } from "@/context/FanContext";
import api from "@/lib/api";
import Ambience from "@/components/Ambience";
import HalloweenIntro from "@/components/HalloweenIntro";
import Protection from "@/components/Protection";
import ChannelHeader from "@/components/ChannelHeader";
import PlayerBar from "@/components/PlayerBar";
import Live from "@/pages/Live";
import Piese from "@/pages/Piese";
import Videoclipuri from "@/pages/Videoclipuri";
import Pareri from "@/pages/Pareri";
import Despre from "@/pages/Despre";
import NotFound from "@/pages/NotFound";

// Adminul se încarcă leneș — codul de administrare NU intră în bundle-ul public
const Admin = lazy(() => import("@/pages/Admin"));

// Procesează returul din Google OAuth (#session_id=...)
function AuthCallback() {
  const navigate = useNavigate();
  const { setMe } = useFan();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true; // sincron — StrictMode safe
    const sid = new URLSearchParams(window.location.hash.slice(1)).get("session_id");
    if (!sid) { navigate("/", { replace: true }); return; }
    api.post("/auth/google/session", { session_id: sid })
      .then((r) => {
        setMe(r.data.user);
        toast.success(`Bine ai venit, ${r.data.user.name}!`);
      })
      .catch(() => toast.error("Autentificarea a eșuat. Încearcă din nou."))
      .finally(() => {
        window.history.replaceState(null, "", "/");
        navigate("/", { replace: true });
      });
  }, [navigate, setMe]);

  return (
    <div className="min-h-[60vh] grid place-items-center" data-testid="auth-callback">
      <p className="font-mono-x text-xs uppercase tracking-widest text-[var(--mist)] animate-pulse">Se face autentificarea…</p>
    </div>
  );
}

function Shell() {
  const location = useLocation();
  // CRITICAL: detectează session_id SINCRON, în render (useLocation, nu window.location)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  const isAdmin = location.pathname.startsWith("/admin");
  return (
    <>
      {!isAdmin && <ChannelHeader />}
      <main className="relative z-10 pb-28">
        <Routes>
          <Route path="/" element={<Live />} />
          <Route path="/piese" element={<Piese />} />
          <Route path="/clipuri" element={<Videoclipuri />} />
          <Route path="/pareri" element={<Pareri />} />
          <Route path="/despre" element={<Despre />} />
          <Route path="/admin" element={
            <Suspense fallback={<div className="min-h-[60vh] grid place-items-center"><p className="font-mono-x text-xs uppercase tracking-widest text-[var(--mist)] animate-pulse">Se încarcă…</p></div>}>
              <Admin />
            </Suspense>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <PlayerBar />
    </>
  );
}

function App() {
  useEffect(() => {
    console.log("%c© BIOXIC 2026 — conținut protejat.%c Furatul nu te face artist.",
      "color:#E8731A;font-weight:bold;font-size:14px", "color:#8A8275;font-size:11px");
  }, []);
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <BrowserRouter>
        <FanProvider>
          <RadioProvider>
            <div className="sky-bg" />
            <Ambience />
            <div className="vignette" />
            <div className="grain-overlay" />
            <span className="limited-vertical hidden lg:block" aria-hidden="true">LIMITED&nbsp;2026&nbsp;·&nbsp;LIMITED&nbsp;2026</span>
            <HalloweenIntro />
            <Protection />
            <Shell />
            <Toaster theme="dark" position="top-center" />
          </RadioProvider>
        </FanProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
