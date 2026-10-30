import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { RadioProvider } from "@/context/RadioContext";
import { FanProvider, useFan } from "@/context/FanContext";
import api from "@/lib/api";
import Preloader from "@/components/Preloader";
import Footer from "@/components/Footer";
import VersionChecker from "@/components/VersionChecker";
import Protection from "@/components/Protection";
import ChannelHeader from "@/components/ChannelHeader";
import PlayerBar from "@/components/PlayerBar";
import Noutati from "@/pages/Noutati";
import Muzica from "@/pages/Muzica";
import Videoclipuri from "@/pages/Videoclipuri";
import VideoPage from "@/pages/VideoPage";
import Contact from "@/pages/Contact";
import TvPage from "@/pages/TvPage";
import Pareri from "@/pages/Pareri";
import NotFound from "@/pages/NotFound";
import { applyA11y } from "@/lib/a11y";

// Adminul, camera live și panoul secret se încarcă leneș — nu intră în bundle-ul inițial
const Admin = lazy(() => import("@/pages/Admin"));
const LiveRoom = lazy(() => import("@/pages/LiveRoom"));
const SecretMod = lazy(() => import("@/pages/SecretMod"));

// Procesează returul din Google OAuth (#session_id=...)
function AuthCallback() {
  const navigate = useNavigate();
  const { setMe } = useFan();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true; // sincron — StrictMode safe
    const sid = new URLSearchParams(window.location.hash.slice(1)).get("session_id");
    if (!sid) {
      // flow OAuth propriu: cookie-urile de sesiune sunt deja setate de backend la callback
      api.get("/fans/me")
        .then((r) => {
          if (!r.data?.user_id) throw new Error("no session");
          setMe(r.data);
          toast.success(`Bine ai venit, ${r.data.name}!`);
        })
        .catch(() => toast.error("Autentificarea a eșuat. Încearcă din nou."))
        .finally(() => navigate("/", { replace: true }));
      return;
    }
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

// Scroll nativ instant: sus la pagină nouă; poziția salvată la înapoi
function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (navType === "POP") {
      const saved = sessionStorage.getItem(`scroll_${location.pathname}`);
      if (saved) { setTimeout(() => window.scrollTo(0, parseInt(saved, 10)), 60); return; }
    }
    window.scrollTo(0, 0);
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
  // + ruta /auth/success (OAuth propriu — cookie-urile sunt deja setate de backend, fără hash)
  if (location.hash?.includes("session_id=") || location.pathname === "/auth/success") {
    return <AuthCallback />;
  }
  return <ShellInner location={location} />;
}

function ShellInner({ location }) {
  const isAdmin = location.pathname.startsWith("/admin") || location.pathname.startsWith("/secret-mod");
  // Camera live e imersivă full-screen: fără header, footer sau bara player peste ea
  const isLive = location.pathname === "/live";

  // reveal la scroll: elementele .rv apar când intră în viewport — inclusiv cele montate târziu
  // (ex. gridurile încărcate de pe server), prin MutationObserver
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("rv-in"); io.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    const watch = (root) => root.querySelectorAll(".rv:not(.rv-in)").forEach((el) => io.observe(el));
    const t = setTimeout(() => watch(document), 80);
    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.matches?.(".rv:not(.rv-in)")) io.observe(n);
        n.querySelectorAll?.(".rv:not(.rv-in)").forEach((el) => io.observe(el));
      }));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { clearTimeout(t); io.disconnect(); mo.disconnect(); };
  }, [location.pathname]);

  // fallback global: orice imagine din /api/files care lipsește pe server (ex. fișier nemigrat)
  // e înlocuită cu logo-ul, fără erori vizibile în pagină
  useEffect(() => {
    const onImgError = (e) => {
      const t = e.target;
      if (t?.tagName === "IMG" && !t.dataset.fbk && (t.src.includes("/api/files/") || t.src.includes("media/image"))) {
        t.dataset.fbk = "1";
        t.src = "/logo-alt.png";
      }
    };
    window.addEventListener("error", onImgError, true);
    return () => window.removeEventListener("error", onImgError, true);
  }, []);

  return (
    <>
      {!isAdmin && !isLive && <ChannelHeader />}
      <ScrollManager />
      <VersionChecker />
      <main className={`relative z-10 ${isLive ? "" : "pb-44 md:pb-32"} ${isAdmin || isLive ? "" : "pt-20 md:pt-24"}`}>
        <Routes>
          <Route path="/" element={<Noutati />} />
          <Route path="/muzica/*" element={<Muzica />} />
          {/* redirecturi din structurile vechi — linkurile vechi nu se strică */}
          <Route path="/piese" element={<Navigate to="/muzica" replace />} />
          <Route path="/radio" element={<Navigate to="/muzica" replace />} />
          <Route path="/despre" element={<Navigate to="/contact" replace />} />
          <Route path="/live" element={
            <Suspense fallback={<div className="min-h-[60vh] grid place-items-center"><p className="font-mono-x text-xs uppercase tracking-widest text-[var(--text-2)] animate-pulse">Se deschide camera live…</p></div>}>
              <LiveRoom />
            </Suspense>
          } />
          <Route path="/clipuri" element={<Videoclipuri />} />
          <Route path="/clipuri/:id" element={<VideoPage />} />
          <Route path="/pareri" element={<Pareri />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/tv" element={<TvPage />} />
          <Route path="/admin" element={
            <Suspense fallback={<div className="min-h-[60vh] grid place-items-center"><p className="font-mono-x text-xs uppercase tracking-widest text-[var(--text-2)] animate-pulse">Se încarcă…</p></div>}>
              <Admin />
            </Suspense>
          } />
          {/* panoul secret de moderare — nelistat în navigație, doar după autentificare */}
          <Route path="/secret-mod" element={
            <Suspense fallback={<div className="min-h-[60vh] grid place-items-center"><p className="font-mono-x text-xs uppercase tracking-widest text-[var(--text-2)] animate-pulse">Se verifică…</p></div>}>
              <SecretMod />
            </Suspense>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdmin && !isLive && <Footer />}
      {!isLive && <PlayerBar />}
    </>
  );
}

function App() {
  useEffect(() => {
    applyA11y();
    console.log("%c© BIOXIC 2026 — conținut protejat.%c Furatul nu te face artist.",
      "color:#00F0FF;font-weight:bold;font-size:14px", "color:#A3A0A8;font-size:11px");
  }, []);
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <BrowserRouter>
        <FanProvider>
          <RadioProvider>
            <div className="void-bg" />
            <div className="vignette" />
            <Preloader />
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
