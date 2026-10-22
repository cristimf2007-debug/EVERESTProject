import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause, Music2, Youtube, AudioLines, Instagram, Share2, Heart, Headphones, Download, ArrowLeft, Cloud } from "lucide-react";
import api, { mediaUrl, API } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";
import { toast } from "sonner";

function CountUp({ to, suffix = "", label, tid }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const dur = 1400;
      const step = (t) => {
        const p = Math.min((t - start) / dur, 1);
        setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);
  const disp = to >= 1000 ? `${(val / 1000).toFixed(val >= to ? 0 : 0)}K` : val;
  return (
    <div ref={ref} className="glass p-5 text-center" data-testid={tid}>
      <b className="block font-display font-black text-3xl text-[var(--accent)] tabular-nums" style={{ textShadow: "0 0 26px rgba(var(--accent-rgb),0.4)" }}>{disp}{suffix}</b>
      <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--dim)]">{label}</span>
    </div>
  );
}

function Visualizer({ active }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const bars = 72;
    const draw = (t) => {
      const w = canvas.width = canvas.offsetWidth * 2;
      const h = canvas.height = canvas.offsetHeight * 2;
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#f3c46a";
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < bars; i++) {
        const x = (i / bars) * w;
        const amp = active ? 0.15 + Math.abs(Math.sin(t / 240 + i * 0.55)) * 0.85 : 0.08;
        const bh = h * amp;
        ctx.fillStyle = i % 7 === 0 ? accent : `rgba(var(--accent2-rgb, 140,199,168), ${0.25 + amp * 0.5})`;
        ctx.fillRect(x, h - bh, (w / bars) * 0.6, bh);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return <canvas ref={canvasRef} className="w-full h-20 sm:h-24" data-testid="track-visualizer" aria-hidden="true" />;
}

const BADGE_STYLE = {
  "#01": "bg-[var(--accent)] text-[var(--on-accent)] font-black",
  "COVER": "border border-[var(--accent)]/60 text-[var(--accent)]",
  "VIRAL TIKTOK": "border border-white/25 text-white",
  "DAT JOS DE PE YOUTUBE": "bg-[var(--berry)] text-white",
};

export default function TrackPage() {
  const { slug } = useParams();
  const [track, setTrack] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const { current, playing, playTrack, toggle } = usePlayer();

  useEffect(() => {
    setTrack(null);
    api.get(`/tracks/${slug}`).then((r) => setTrack(r.data)).catch(() => setNotFound(true));
  }, [slug]);

  const isCurrent = track && current?.id === track.id;
  const isPlaying = isCurrent && playing;

  const storyParagraphs = useMemo(() => (track?.story || "").split("\n\n").filter(Boolean), [track]);
  const timeline = track?.timeline || [];

  const share = () => {
    const url = `${API}/share/${track.slug || track.id}`;
    navigator.clipboard?.writeText(url).then(() => toast.success("Link copiat!", { description: "Arată perfect pe WhatsApp și TikTok." })).catch(() => {});
  };

  const like = async () => {
    try {
      const r = await api.post(`/tracks/${track.id}/like`);
      setTrack((t) => ({ ...t, likes: r.data.likes }));
    } catch (e) { /* ignoră */ }
  };

  if (notFound) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-center px-4" data-testid="track-not-found">
        <div>
          <p className="font-display text-xl mb-4">Piesa nu există.</p>
          <Link to="/muzica" className="btn-x gold">Înapoi la Seif</Link>
        </div>
      </div>
    );
  }
  if (!track) return <div className="min-h-[50vh] grid place-items-center text-[var(--dim)]" data-testid="track-loading">Se încarcă...</div>;

  const links = track.links || {};
  const linkDefs = [
    { key: "tiktok", label: "TikTok", icon: Music2 },
    { key: "youtube", label: "YouTube", icon: Youtube },
    { key: "spotify", label: "Spotify", icon: AudioLines },
    { key: "instagram", label: "Instagram", icon: Instagram },
    { key: "soundcloud", label: "SoundCloud", icon: Cloud },
  ].filter((l) => links[l.key]);

  return (
    <div data-testid="track-page" className="max-w-[1120px] mx-auto px-4 py-10">
      <Link to="/muzica" data-testid="track-back" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--mist)] hover:text-[var(--accent)] transition-colors mb-8">
        <ArrowLeft size={14} /> Înapoi la Seif
      </Link>

      {/* HERO */}
      <div className="grid lg:grid-cols-[420px_1fr] gap-10 items-start">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className={`relative rounded-2xl overflow-hidden ${isPlaying ? "beat-pulse" : ""}`} style={{ boxShadow: "0 0 60px rgba(var(--accent-rgb),0.2)" }}>
            <img src={mediaUrl(track.cover_url)} alt={track.title} className="w-full aspect-square object-cover" data-testid="track-cover" />
            <button
              data-testid="track-play-big"
              onClick={() => (isCurrent ? toggle() : playTrack(track, [track]))}
              className="absolute inset-0 grid place-items-center bg-black/25 hover:bg-black/35 transition-colors group"
              aria-label={isPlaying ? "Pauză" : `Redă ${track.title}`}
            >
              <span className="w-24 h-24 rounded-full grid place-items-center transition-transform group-hover:scale-110"
                style={{ background: "linear-gradient(180deg,var(--accent-hi),var(--accent))", color: "var(--on-accent)", boxShadow: "0 12px 45px -8px rgba(var(--accent-rgb),0.8)" }}>
                {isPlaying ? <Pause size={38} fill="currentColor" /> : <Play size={38} fill="currentColor" className="ml-1.5" />}
              </span>
            </button>
          </div>
          <div className="glass mt-4 px-4 py-2 rounded-2xl">
            <Visualizer active={!!isPlaying} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
          <div className="flex flex-wrap gap-2 mb-4" data-testid="track-badges">
            {(track.badges || []).map((b) => (
              <span key={b} className={`font-mono-x text-[10px] tracking-[0.14em] px-2.5 py-1.5 rounded-md ${BADGE_STYLE[b] || "border border-white/20"}`} data-testid={`badge-${b.replace(/[^A-Z0-9]/gi, "-")}`}>{b}</span>
            ))}
          </div>
          <h1 className="font-display font-black text-[clamp(28px,5vw,52px)] leading-[1.02] tracking-tight" data-testid="track-title">{track.title}</h1>
          <p className="text-[var(--mist)] mt-2" data-testid="track-artist">{track.artist} · pe site din {track.published || "22.10.2026"}</p>

          {/* STATISTICI */}
          {track.stats && (
            <div className="grid grid-cols-3 gap-3 mt-7" data-testid="track-stats">
              <CountUp to={track.stats.tiktok_views} suffix="+" label="vizualizări TikTok" tid="stat-tiktok" />
              <CountUp to={track.stats.sound_views} suffix="" label="vizualizări pe sunet" tid="stat-sound" />
              <CountUp to={track.stats.sound_uses} suffix="+" label="folosiri ale sunetului" tid="stat-uses" />
            </div>
          )}

          {/* LINKURI */}
          <div className="flex flex-wrap gap-2.5 mt-7" data-testid="track-links">
            {linkDefs.map((l) => (
              <a key={l.key} href={links[l.key]} target="_blank" rel="noopener noreferrer" data-testid={`link-${l.key}`}
                className="btn-x !py-2.5 !px-4 text-[13px] hover:border-[var(--accent)]/60 hover:shadow-[0_0_24px_rgba(var(--accent-rgb),0.25)]">
                <l.icon size={15} /> {l.label}
              </a>
            ))}
            <span data-testid="link-soundcloud" className="btn-x !py-2.5 !px-4 text-[13px] opacity-40 cursor-not-allowed" title="Link-ul SoundCloud va fi adăugat în curând">
              <Cloud size={15} /> SoundCloud — în curând
            </span>
          </div>

          {/* ACȚIUNI */}
          <div className="flex flex-wrap items-center gap-3 mt-7 pt-6 border-t border-[var(--line)]">
            <button data-testid="track-share" onClick={share} className="btn-x gold"><Share2 size={15} /> Distribuie piesa</button>
            <button data-testid="track-like" onClick={like} className="btn-x"><Heart size={15} /> {track.likes}</button>
            <span className="chip-x flex items-center gap-1.5" data-testid="track-plays"><Headphones size={12} /> {track.plays} ascultări</span>
            {track.download_enabled && (
              <a data-testid="track-download" href={mediaUrl(`/api/tracks/${track.id}/download`)} className="btn-x"><Download size={15} /> Download</a>
            )}
          </div>
        </motion.div>
      </div>

      {/* POVESTEA PIESEI */}
      {track.story && (
        <section className="mt-20 max-w-3xl" data-testid="track-story">
          <div className="eyebrow mb-2">Cum a ajuns aici</div>
          <h2 className="font-display font-extrabold text-[clamp(24px,4vw,38px)] mb-10">Povestea piesei</h2>
          <div className="relative pl-10">
            <span className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: "linear-gradient(180deg, var(--accent), transparent)" }} />
            {storyParagraphs.map((p, i) => {
              const tl = timeline[i] || {};
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }}
                  className="relative pb-9 last:pb-0" data-testid={`story-p-${i}`}>
                  <span className="absolute -left-10 top-1.5 w-[15px] h-[15px] rounded-full border-2 border-[var(--accent)] bg-[var(--night)]" style={{ boxShadow: "0 0 14px rgba(var(--accent-rgb),0.6)" }} />
                  {(tl.label || tl.date) && (
                    <p className="font-mono-x text-[11px] tracking-[0.14em] uppercase text-[var(--accent)] mb-1.5">
                      {tl.date && <span className="text-[var(--dim)]">{tl.date} · </span>}{tl.label}
                    </p>
                  )}
                  <p className="text-[15px] leading-relaxed text-[var(--frost)]/90">{p}</p>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
