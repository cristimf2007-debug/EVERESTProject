import React, { useEffect, useRef, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { RadioProvider } from "@/context/RadioContext";
import { FanProvider, useFan } from "@/context/FanContext";
import api from "@/lib/api";
import Ambience from "@/components/Ambience";
import Preloader from "@/components/Preloader";
import Cursor from "@/components/Cursor";
import PageCurtain from "@/components/PageCurtain";
import Footer from "@/components/Footer";
import VersionChecker from "@/components/VersionChecker";
import Protection from "@/components/Protection";
import ChannelHeader from "@/components/ChannelHeader";
import PlayerBar from "@/components/PlayerBar";
import Acasa from "@/pages/Acasa";
import Muzica from "@/pages/Muzica";
import Videoclipuri from "@/pages/Videoclipuri";
import VideoPage from "@/pages/VideoPage";
import Pareri from "@/pages/Pareri";
import Despre from "@/pages/Despre";
import NotFound from "@/pages/NotFound";
import { initSmoothScroll, scrollToY } from "@/lib/smoothScroll";
import { applyA11y } from "@/lib/a11y";

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
      <p className="font-mono-x text-xs uppercase tracking-widest text-[var(--text-2)] animate-pulse">Se face autentificarea…</p>
    </div>
  );
}

// Scroll: sus la pagină nouă; poziția salvată la înapoi pe /clipuri
function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (navType === "POP") {
      const saved = sessionStorage.getItem(`scroll_${location.pathname}`);
      if (saved) { setTimeout(() => scrollToY(parseInt(saved, 10)), 60); return; }
    }
    scrollToY(0);
  }, [location.pathname, navType]);
  useEffect(() => {
    const save = () => sessionStorage.setItem(`scroll_${location.pathname}`, String(window.scrollY));
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [location.pathname]);
  return null;
}

function Shell() {
  const location = useLocation();
  // CRITICAL: detectează session_id SINCRON, în render (useLocation, nu window.location)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return <ShellInner location={location} />;
}

function ShellInner({ location }) {
  const isAdmin = location.pathname.startsWith("/admin");

  // reveal la scroll: elementele .rv apar linie cu linie când intră în viewport
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("rv-in"); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    const t = setTimeout(() => {
      document.querySelectorAll(".rv:not(.rv-in)").forEach((el) => io.observe(el));
    }, 80);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [location.pathname]);

  return (
    <>
      {!isAdmin && <ChannelHeader />}
      <ScrollManager />
      <PageCurtain />
      <VersionChecker />
      <main className={`relative z-10 pb-44 md:pb-32 ${isAdmin ? "" : "pt-20 md:pt-24"}`}>
        <Routes>
          <Route path="/" element={<Acasa />} />
          <Route path="/muzica/*" element={<Muzica />} />
          {/* redirecturi din structura veche — linkurile vechi nu se strică */}
          <Route path="/piese" element={<Navigate to="/muzica/piese" replace />} />
          <Route path="/live" element={<Navigate to="/muzica" replace />} />
          <Route path="/clipuri" element={<Videoclipuri />} />
          <Route path="/clipuri/:id" element={<VideoPage />} />
          <Route path="/pareri" element={<Pareri />} />
          <Route path="/despre" element={<Despre />} />
          <Route path="/admin" element={
            <Suspense fallback={<div className="min-h-[60vh] grid place-items-center"><p className="font-mono-x text-xs uppercase tracking-widest text-[var(--text-2)] animate-pulse">Se încarcă…</p></div>}>
              <Admin />
            </Suspense>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
      <PlayerBar />
    </>
  );
}

function App() {
  useEffect(() => {
    applyA11y();
    initSmoothScroll();
    console.log("%c© BIOXIC 2026 — conținut protejat.%c Furatul nu te face artist.",
      "color:#FF7A1A;font-weight:bold;font-size:14px", "color:#9A968F;font-size:11px");
  }, []);
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <BrowserRouter>
        <FanProvider>
          <RadioProvider>
            <div className="void-bg" />
            <Ambience />
            <div className="vignette" />
            <div className="grain-overlay" />
            <span className="limited-vertical hidden lg:block" aria-hidden="true">LIMITED&nbsp;2026&nbsp;·&nbsp;LIMITED&nbsp;2026</span>
            <Preloader />
            <Cursor />
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
