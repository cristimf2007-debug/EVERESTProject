import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, Loader2, ChevronDown, Clapperboard, Eye, ArrowRight, Radio } from "lucide-react";
import { useRadio } from "@/context/RadioContext";
import api, { mediaUrl, getSid } from "@/lib/api";
import CeENou from "@/components/CeENou";

// fum fin care urcă în hero — canvas ușor, puține pete moi
function Smoke() {
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.classList.contains("a11y-rm")) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W, H, raf;
    const size = () => { W = canvas.width = canvas.clientWidth * dpr; H = canvas.height = canvas.clientHeight * dpr; };
    size();
    window.addEventListener("resize", size);
    const puffs = Array.from({ length: 9 }, () => ({
      x: Math.random(), y: 0.7 + Math.random() * 0.5,
      r: 60 + Math.random() * 140,
      vy: 0.0005 + Math.random() * 0.0009,
      drift: Math.random() * 6.28,
      a: 0.04 + Math.random() * 0.05,
    }));
    let t = 0;
    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, W, H);
      for (const p of puffs) {
        p.y -= p.vy;
        if (p.y < -0.35) { p.y = 1.25; p.x = Math.random(); }
        const x = (p.x + Math.sin(t + p.drift) * 0.03) * W;
        const y = p.y * H;
        const r = p.r * dpr;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(154,150,143,${p.a})`);
        g.addColorStop(1, "rgba(154,150,143,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 6.28);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" data-testid="hero-smoke" />;
}

// contor animat la intrarea în viewport
function Counter({ value, suffix = "" }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-rm")) { setN(value); return; }
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const D = 1200;
      const tick = (t) => {
        const p = Math.min(1, (t - start) / D);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return <span ref={ref} className="stat-num" data-testid="stat-counter">{n.toLocaleString("ro-RO")}{suffix}</span>;
}

// buton flame magnetic — lumina urmărește mouse-ul, magnetism ±4px
const magnet = {
  onMouseMove: (e) => {
    const b = e.currentTarget;
    const r = b.getBoundingClientRect();
    b.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    b.style.transform = `translate(${dx * 8}px, ${dy * 6}px)`;
  },
  onMouseLeave: (e) => { e.currentTarget.style.transform = ""; },
};

// card de piesă pe home — cover cu reflexie oglindă + tilt
function HomeTrack({ t, i }) {
  const { current, mode, playing, playTrack, toggle } = useRadio();
  const isCur = current?.id === t.id && mode === "track";
  const isPlayingThis = isCur && playing;
  const src = mediaUrl(t.cover_url) || "/logo-alt.png";
  return (
    <article
      className={`group cursor-pointer rv ${i ? `rv-d${Math.min(i, 3)}` : ""}`}
      data-testid={`home-track-${t.id}`}
      data-cursor="PLAY"
      onClick={() => (isCur ? toggle() : playTrack(t))}
    >
      <div className="tilt">
        <div className={`relative aspect-square rounded-2xl overflow-hidden border ${isCur ? "border-[rgba(var(--flame-rgb),.55)]" : "border-[var(--edge)]"}`}
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.08), 0 24px 50px -24px rgba(0,0,0,.9)" }}>
          <img src={src} alt={t.title} className={`w-full h-full ${t.cover_url ? "object-cover" : "object-contain p-8"}`} style={{ background: "var(--obsidian-2)" }} loading="lazy" />
          <span className={`absolute inset-0 grid place-items-center transition-opacity duration-300 ${isCur ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} style={{ background: "rgba(5,5,5,.45)" }}>
            <span className="knob !w-14 !h-14" style={{ color: "var(--flame)" }}>
              {isPlayingThis ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </span>
          </span>
        </div>
        <div className="reflection" aria-hidden="true">
          <img src={src} alt="" loading="lazy" />
        </div>
      </div>
      <h3 className="font-semibold text-sm truncate mt-3.5">{t.title}</h3>
      <p className="text-[10px] font-mono-x uppercase tracking-[0.16em] text-[var(--text-3)] mt-1">{t.artist || "BIOXIC"}</p>
    </article>
  );
}

// bandă compactă „Acum la radio" → duce la camera live din Muzică
function NowStrip() {
  const { liveInfo, playing, mode, toggle } = useRadio();
  const track = liveInfo?.track;
  if (!track) return null;
  const livePlaying = playing && mode === "live";
  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-6 rv" data-testid="home-now-strip">
      <div className="ob-card flex items-center gap-4 px-4 sm:px-5 py-3.5">
        <button
          onClick={toggle}
          className="knob shrink-0"
          style={livePlaying ? { color: "var(--flame)" } : {}}
          aria-label={livePlaying ? "Pauză" : "Ascultă live"}
          data-testid="home-now-play"
        >
          {livePlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </button>
        <img src={mediaUrl(track.cover_url) || "/logo-alt.png"} alt="" className={`w-11 h-11 rounded-full object-cover border border-[var(--edge-hi)] ${livePlaying ? "vinyl-spin" : ""}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-mono-x uppercase tracking-[0.25em] text-[var(--live)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--live)] live-dot" /> Acum la radio
          </p>
          <p className="text-sm font-semibold truncate mt-0.5">{track.title}</p>
        </div>
        <Link to="/muzica" className="btn-ghost rounded-full px-4 py-2 text-[10px] font-mono-x uppercase tracking-widest flex items-center gap-2 shrink-0" data-testid="home-now-open">
          <Radio size={12} /> Camera live
        </Link>
      </div>
    </div>
  );
}

export default function Acasa() {
  const { status, playing, queue, toggle } = useRadio();
  const [videos, setVideos] = useState([]);
  const [subs, setSubs] = useState(0);
  const wordmarkRef = useRef(null);

  const latest = [...queue].slice(-4).reverse();
  const totalPlays = queue.reduce((s, t) => s + (t.plays || 0), 0);

  useEffect(() => {
    api.get("/videos").then((r) => setVideos((r.data || []).slice(0, 3))).catch(() => {});
    api.get(`/channel/status?sid=${getSid()}`).then((r) => setSubs(r.data.subscribers || 0)).catch(() => {});
  }, []);

  // reflexia wordmark-ului urmărește mouse-ul
  const onHeroMove = (e) => {
    const w = wordmarkRef.current;
    if (!w) return;
    const r = w.getBoundingClientRect();
    w.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
    w.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div data-testid="acasa-page" className="relative">
      {/* ============ HERO ============ */}
      <section className="hero" onPointerMove={onHeroMove} data-testid="hero">
        <Smoke />
        <div className="hero-candle candle-flicker" aria-hidden="true" />
        <p className="badge-engraved rv" data-testid="hero-kicker">Radio live · 24/7 · fără întreruperi</p>
        <h1 ref={wordmarkRef} className="wordmark rv mt-4" data-testid="hero-wordmark">BIOXIC</h1>
        <div className="stamp mt-5 rv" data-testid="hero-stamp">Limited 2026 · Halloween Edition</div>
        <div className="flex flex-wrap items-center justify-center gap-3.5 mt-11 rv">
          <button
            className="btn-flame"
            data-testid="hero-play-button"
            data-cursor="PLAY"
            onClick={toggle}
            disabled={status === "loading"}
            {...magnet}
          >
            {status === "loading" ? <Loader2 size={15} className="animate-spin" />
              : playing ? <Pause size={15} fill="currentColor" />
              : <Play size={15} fill="currentColor" />}
            {status === "loading" ? "Se încarcă…" : playing ? "Pauză" : "Ascultă live"}
          </button>
          <Link to="/clipuri" className="btn-steel" data-testid="hero-videos-button">
            <Clapperboard size={14} /> Videoclipuri
          </Link>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-[var(--text-3)]" aria-hidden="true">
          <span className="font-mono-x text-[9px] uppercase tracking-[0.35em]">Derulează</span>
          <ChevronDown size={14} className="animate-bounce" />
        </div>
      </section>

      {/* ============ DE LA ULTIMA VIZITĂ ============ */}
      <CeENou />

      {/* ============ ACUM LA RADIO ============ */}
      <NowStrip />

      {/* ============ ULTIMELE PIESE ============ */}
      {latest.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-24 sm:mt-28" data-testid="home-latest-tracks">
          <header className="flex items-end justify-between gap-4 rv">
            <div>
              <p className="badge-engraved">Proaspete din seif</p>
              <h2 className="font-display text-3xl sm:text-4xl uppercase mt-2">Ultimele piese</h2>
            </div>
            <Link to="/muzica/piese" className="btn-ghost rounded-full px-5 py-2.5 text-[10px] font-mono-x uppercase tracking-widest flex items-center gap-2 shrink-0" data-testid="home-all-tracks">
              Toate <ArrowRight size={12} />
            </Link>
          </header>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7 mt-9">
            {latest.map((t, i) => <HomeTrack key={t.id} t={t} i={i} />)}
          </div>
        </section>
      )}

      {/* ============ VIDEOCLIPURI ============ */}
      {videos.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-24 sm:mt-28" data-testid="home-videos">
          <header className="flex items-end justify-between gap-4 rv">
            <div>
              <p className="badge-engraved">Remixuri în mișcare</p>
              <h2 className="font-display text-3xl sm:text-4xl uppercase mt-2">Videoclipuri</h2>
            </div>
            <Link to="/clipuri" className="btn-ghost rounded-full px-5 py-2.5 text-[10px] font-mono-x uppercase tracking-widest flex items-center gap-2 shrink-0" data-testid="home-all-videos">
              Toate <ArrowRight size={12} />
            </Link>
          </header>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-9">
            {videos.map((v, i) => (
              <Link key={v.id} to={`/clipuri/${v.id}`} className={`ob-card track-card block rv ${i ? `rv-d${Math.min(i, 3)}` : ""}`} data-testid={`home-video-${v.id}`} data-cursor="PLAY">
                <div className="relative aspect-video bg-black group">
                  <video src={mediaUrl(v.video_url)} poster={mediaUrl(v.thumb_url) || undefined} preload="metadata" muted playsInline className="w-full h-full object-cover pointer-events-none" />
                  <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(5,5,5,.45)" }}>
                    <span className="knob !w-14 !h-14" style={{ color: "var(--flame)" }}><Play size={20} fill="currentColor" className="ml-0.5" /></span>
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2">{v.title}</h3>
                  <p className="text-[9px] font-mono-x uppercase tracking-[0.16em] text-[var(--text-3)] mt-1.5 flex items-center gap-1.5">
                    <Eye size={10} /> {v.views || 0} vizualizări
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============ CIFRE ============ */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-24 sm:mt-28" data-testid="home-stats">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { v: queue.length, label: "Piese în rotație", tid: "stat-tracks" },
            { v: totalPlays, label: "Redări totale", tid: "stat-plays" },
            { v: subs, label: "Abonați", tid: "stat-subs" },
            { v: 24, suffix: "/7", label: "Live non-stop", tid: "stat-live" },
          ].map((s, i) => (
            <div key={s.tid} className={`rv ${i ? `rv-d${Math.min(i, 3)}` : ""}`} data-testid={s.tid}>
              <Counter value={s.v} suffix={s.suffix || ""} />
              <p className="badge-engraved mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
