import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Youtube, Radio, Disc3, Bot, ArrowRight, Users, Eye, Video, UserPlus } from "lucide-react";
import api from "@/lib/api";
import DiscordButton from "@/components/DiscordButton";

const AI_IMG = "https://images.pexels.com/photos/5474035/pexels-photo-5474035.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const REMIX_IMG = "https://images.pexels.com/photos/7542650/pexels-photo-7542650.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const VIDEO_CATS = [
  { key: "toate", label: "Toate" },
  { key: "remix", label: "Remixuri" },
  { key: "ai", label: "AI" },
  { key: "original", label: "Originale" },
];

function videoCat(v) {
  const t = v.title.toLowerCase();
  if (t.includes("artificial") || t.includes(" ai ") || t.includes("(ai") || t.includes(" ai)")) return "ai";
  if (t.includes("remix")) return "remix";
  return "original";
}

function Stat({ icon: Icon, label, value, testid }) {
  return (
    <div className="glass p-5 rounded-sm" data-testid={testid}>
      <Icon size={18} className="text-[#39FF14] mb-2" />
      <p className="font-display font-bold text-2xl text-white">{value ?? "—"}</p>
      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState(null);
  const [live, setLive] = useState(false);
  const [tagline, setTagline] = useState("Manele Remixate & Manele Artificiale");
  const [vcat, setVcat] = useState("toate");

  useEffect(() => {
    api.get("/youtube/videos").then((r) => setVideos(r.data || [])).catch(() => {});
    api.get("/youtube/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/live/status").then((r) => setLive(!!r.data.is_live)).catch(() => {});
    api.get("/content").then((r) => { if (r.data.hero_tagline) setTagline(r.data.hero_tagline); }).catch(() => {});
  }, []);

  const latest = videos[0];
  const filteredVideos = useMemo(
    () => (vcat === "toate" ? videos : videos.filter((v) => videoCat(v) === vcat)),
    [videos, vcat]
  );

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden scanlines">
        <div className="absolute inset-0">
          <img src="/artist.jpg" alt="BIOXIC" className="w-full h-full object-cover object-[center_25%] opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050805] via-[#050805]/75 to-[#050805]/40" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(57,255,20,0.14) 0%, transparent 55%)" }} />
        </div>

        {live && (
          <Link to="/live" data-testid="live-banner" className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-5 py-2.5 bg-[#39FF14] text-black font-display font-bold text-xs tracking-widest uppercase hover:bg-[#00C853] transition-colors">
            <span className="w-2 h-2 rounded-full bg-black live-dot" /> LIVE ACUM — Intră în stream
          </Link>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-16 w-full grid lg:grid-cols-[1fr_360px] gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <img src="/logo.png" alt="BIOXIC" data-testid="hero-logo"
              className="h-24 sm:h-32 mb-6" style={{ filter: "drop-shadow(0 0 24px rgba(57,255,20,0.45))" }} />
            <p className="text-[#39FF14] text-xs sm:text-sm uppercase tracking-[0.45em] mb-4" data-testid="hero-motto">No risks, no hits.</p>
            <p className="text-zinc-300 text-base sm:text-lg max-w-lg" data-testid="hero-tagline">
              {tagline} — sunetul unei generații noi de manele.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/muzica" data-testid="hero-listen-button"
                className="btn-cut flex items-center gap-2 px-8 py-4 bg-[#39FF14] text-black font-display font-bold text-sm tracking-widest uppercase hover:bg-[#00C853] transition-colors btn-breathe">
                <Play size={16} fill="black" /> Ascultă acum
              </Link>
              <Link to="/videoclipuri" data-testid="hero-videos-button"
                className="btn-cut flex items-center gap-2 px-8 py-4 border border-[#39FF14]/60 text-[#39FF14] font-display font-bold text-sm tracking-widest uppercase hover:bg-[#39FF14] hover:text-black transition-colors">
                <Youtube size={16} /> Videoclipuri
              </Link>
            </div>
          </motion.div>

          {/* ULTIMA LANSARE */}
          {latest && (
            <motion.a initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.7 }}
              href={`https://www.youtube.com/watch?v=${latest.id}`} target="_blank" rel="noopener noreferrer"
              data-testid="hero-latest-card"
              className="group glass rounded-sm overflow-hidden hover:box-glow-strong transition-shadow hidden lg:block">
              <div className="relative aspect-video overflow-hidden">
                <img src={latest.thumbnail} alt={latest.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="p-4 bg-[#39FF14] rounded-sm"><Play size={24} fill="black" className="text-black" /></span>
                </div>
                <span className="absolute top-3 left-3 px-3 py-1.5 bg-[#39FF14] text-black text-[10px] font-black uppercase tracking-widest">Ultima lansare</span>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold line-clamp-2 group-hover:text-[#39FF14] transition-colors" data-testid="hero-latest">{latest.title}</p>
                <p className="text-[11px] text-zinc-500 mt-2">{new Date(latest.published).toLocaleDateString("ro-RO")}</p>
              </div>
            </motion.a>
          )}
        </div>
      </section>

      {/* TICKER */}
      <div className="relative z-10 border-y border-[#39FF14]/20 bg-[#050805]/80 overflow-hidden py-3" data-testid="ticker">
        <div className="marquee-track">
          {[0, 1].map((n) => (
            <div key={n} className="flex shrink-0 items-center gap-8 pr-8 font-display text-xs uppercase tracking-[0.35em] text-[#39FF14]/80">
              {["Manele Remixate", "Manele Artificiale", "No risks, no hits", "BIOXIC HOUSE", "Live & Cereri de piese", "Piese noi constant"].map((t) => (
                <span key={t} className="flex items-center gap-8 whitespace-nowrap">{t} <span className="text-[#00C853]">✦</span></span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* VIDEOCLIPURI */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <h2 className="font-display font-bold text-2xl sm:text-4xl uppercase tracking-tight">Ultimele <span className="text-[#39FF14]">videoclipuri</span></h2>
          <Link to="/videoclipuri" data-testid="see-all-videos" className="text-xs uppercase tracking-widest text-zinc-400 hover:text-[#39FF14] transition-colors flex items-center gap-2">Toate <ArrowRight size={14} /></Link>
        </div>
        <div className="flex flex-wrap gap-2 mb-8" data-testid="video-cats">
          {VIDEO_CATS.map((c) => (
            <button key={c.key} data-testid={`vcat-${c.key}`} onClick={() => setVcat(c.key)}
              className={`px-5 py-2 text-xs uppercase tracking-widest border transition-colors ${vcat === c.key ? "bg-[#39FF14] text-black border-[#39FF14] font-bold" : "border-white/15 text-zinc-400 hover:border-[#39FF14]/50 hover:text-white"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.slice(0, 6).map((v, i) => (
            <motion.a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"
              data-testid={`home-video-${i}`}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className="group glass rounded-sm overflow-hidden hover:box-glow transition-shadow">
              <div className="relative aspect-video overflow-hidden">
                <img src={v.thumbnail} alt={v.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play size={40} className="text-[#39FF14]" fill="#39FF14" />
                </div>
                {i === 0 && vcat === "toate" && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#39FF14] text-black text-[10px] font-black uppercase tracking-widest">Nou</span>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold line-clamp-2 group-hover:text-[#39FF14] transition-colors">{v.title}</p>
                <p className="text-[11px] text-zinc-500 mt-2">{new Date(v.published).toLocaleDateString("ro-RO")}</p>
              </div>
            </motion.a>
          ))}
        </div>
        {filteredVideos.length === 0 && <p className="text-zinc-500 py-10 text-sm" data-testid="no-videos-cat">Niciun videoclip în această categorie.</p>}
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <Stat icon={Users} label="Abonați YouTube" testid="stat-subscribers"
            value={stats && !stats.fallback ? stats.subscribers?.toLocaleString("ro-RO") : "în curând"} />
          <Stat icon={Eye} label="Vizualizări" testid="stat-views"
            value={stats && !stats.fallback ? stats.views?.toLocaleString("ro-RO") : "50M+"} />
          <Stat icon={Video} label="Videoclipuri" testid="stat-videos"
            value={stats && !stats.fallback ? stats.videos : videos.length || "—"} />
        </div>
      </section>

      {/* REMIXATE vs AI */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="font-display font-bold text-2xl sm:text-4xl uppercase tracking-tight mb-10">
          Două lumi. <span className="text-[#39FF14]">Un singur sunet.</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/muzica?g=remix" data-testid="card-remixate" className="group relative h-80 overflow-hidden rounded-sm border border-white/10 hover:border-[#39FF14]/50 transition-colors">
            <img src={REMIX_IMG} alt="Manele Remixate" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050805] to-transparent" />
            <div className="absolute bottom-0 p-8">
              <Disc3 size={28} className="text-[#39FF14] mb-3" />
              <h3 className="font-display font-bold text-2xl uppercase tracking-tight glitch-hover" data-text="Manele Remixate">Manele Remixate</h3>
              <p className="text-zinc-400 text-sm mt-2 max-w-sm">Clasicele manelelor, reconstruite cu bas greu și energie de club.</p>
              <span className="inline-flex items-center gap-2 mt-4 text-[#39FF14] text-xs uppercase tracking-widest">Ascultă <ArrowRight size={14} /></span>
            </div>
          </Link>
          <Link to="/muzica?g=ai" data-testid="card-ai" className="group relative h-80 overflow-hidden rounded-sm border border-white/10 hover:border-[#39FF14]/50 transition-colors">
            <img src={AI_IMG} alt="Manele Artificiale" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050805] to-transparent" />
            <div className="absolute bottom-0 p-8">
              <Bot size={28} className="text-[#39FF14] mb-3" />
              <h3 className="font-display font-bold text-2xl uppercase tracking-tight glitch-hover" data-text="Manele Artificiale">Manele Artificiale</h3>
              <p className="text-zinc-400 text-sm mt-2 max-w-sm">Concept AI: manele generate și modificate de inteligență artificială. Viitorul genului.</p>
              <span className="inline-flex items-center gap-2 mt-4 text-[#39FF14] text-xs uppercase tracking-widest">Explorează <ArrowRight size={14} /></span>
            </div>
          </Link>
        </div>
      </section>

      {/* QUOTE */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="glass rounded-sm p-10 sm:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 0%, rgba(57,255,20,0.08) 0%, transparent 60%)" }} />
          <p className="relative font-display text-xl sm:text-3xl font-bold leading-snug" data-testid="guta-quote">
            „Un tinerel în curs de <span className="text-[#39FF14] text-glow">perfeționare</span>"
          </p>
          <p className="relative mt-4 text-xs uppercase tracking-[0.3em] text-zinc-500">— Nicolae Guță</p>
        </div>
      </section>

      {/* COMUNITATE: DISCORD + CONT */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="glass rounded-sm p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 85% 20%, rgba(88,101,242,0.15) 0%, transparent 50%)" }} />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight mb-3">
                Intră în <span className="text-[#5865F2]">BIOXIC HOUSE</span>
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base mb-6 max-w-md">
                Comunitatea oficială: piese în avans, cereri directe la live-uri, vorbește cu BIOXIC și cu ceilalți fani.
              </p>
              <DiscordButton tid="home-discord" />
            </div>
            <div className="glass rounded-sm p-6 border-[#39FF14]/20">
              <h3 className="font-display font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                <UserPlus size={15} className="text-[#39FF14]" /> Cont de fan
              </h3>
              <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                Fă-ți cont în 10 secunde — cu Google sau email. Salvezi piese favorite și primești email la fiecare lansare și live.
              </p>
              <Link to="/cont" data-testid="home-cont-cta" className="btn-cut inline-block px-6 py-3.5 border border-[#39FF14] text-[#39FF14] font-display font-bold text-xs tracking-widest uppercase hover:bg-[#39FF14] hover:text-black transition-colors">
                Creează cont gratuit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA LIVE */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <Link to="/live" data-testid="home-live-cta" className="block relative overflow-hidden rounded-sm border border-[#39FF14]/30 p-10 sm:p-14 group hover:border-[#39FF14] transition-colors scanlines">
          <div className="absolute inset-0 bg-gradient-to-r from-[#39FF14]/10 to-transparent opacity-50" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="flex items-center gap-2 text-[#39FF14] text-xs uppercase tracking-[0.3em] mb-3"><Radio size={14} /> BIOXIC Live</p>
              <h3 className="font-display font-bold text-2xl sm:text-3xl uppercase">Stream-uri live, chat cu fanii, cereri de piese</h3>
            </div>
            <span className="btn-cut px-8 py-4 bg-[#39FF14] text-black font-display font-bold text-sm tracking-widest uppercase group-hover:bg-[#00C853] transition-colors whitespace-nowrap">Intră pe Live</span>
          </div>
        </Link>
      </section>
    </div>
  );
}
