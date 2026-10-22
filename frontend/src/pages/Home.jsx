import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause, Youtube, Music2, Instagram, AudioLines, Radio, Megaphone } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";
import DiscordButton from "@/components/DiscordButton";

const COLLABS = ["Nicolae Guță", "Nek Music", "Șușanu", "Lucheș", "210 Production"];

const SOCIALS = [
  { small: "YouTube", big: "@djbioxic", href: "https://www.youtube.com/@djbioxic", icon: Youtube, tid: "social-youtube" },
  { small: "TikTok", big: "@bioxic.exe", href: "https://www.tiktok.com/@bioxic.exe", icon: Music2, tid: "social-tiktok" },
  { small: "Instagram", big: "@crss.exe_", href: "https://www.instagram.com/crss.exe_", icon: Instagram, tid: "social-instagram" },
  { small: "Spotify", big: "BIOXIC", href: "https://open.spotify.com/artist/4tlelg9L2y1OFOVpUkIiAK", icon: AudioLines, tid: "social-spotify" },
];

function nextChristmas() {
  const now = new Date();
  const y = now.getFullYear();
  const c = new Date(y, 11, 25, 0, 0, 0);
  return now > c ? new Date(y + 1, 11, 25, 0, 0, 0) : c;
}

function ChristmasCountdown() {
  const [t, setT] = useState({ d: "—", h: "--", m: "--", s: "--" });
  useEffect(() => {
    const target = nextChristmas();
    const tick = () => {
      const diff = target - new Date();
      if (diff <= 0) { setT({ d: "0", h: "00", m: "00", s: "00" }); return; }
      setT({
        d: String(Math.floor(diff / 86400000)),
        h: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0"),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0"),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, "0"),
      });
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="glass frost-edge p-6 grid gap-4" data-testid="christmas-countdown" aria-live="polite">
      <div className="eyebrow">Până la Crăciun</div>
      <div className="flex gap-2.5 items-baseline">
        <strong className="font-display font-black text-6xl text-[#f3c46a] tabular-nums" style={{ textShadow: "0 0 30px rgba(243,196,106,.4)" }} data-testid="cd-days">{t.d}</strong>
        <span className="text-[#9db3a8]">zile</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["ore", t.h, "cd-h"], ["min", t.m, "cd-m"], ["sec", t.s, "cd-s"]].map(([label, val, tid]) => (
          <div key={tid} className="border border-[rgba(234,242,237,0.11)] rounded-xl px-2.5 py-2 text-center">
            <b className="block font-mono-x text-lg tabular-nums" data-testid={tid}>{val}</b>
            <span className="text-[10px] tracking-[0.14em] uppercase text-[#6c8378]">{label}</span>
          </div>
        ))}
      </div>
      <p className="text-[13px] text-[#9db3a8]">Pregătesc ceva pentru sărbători. Primul care află e cine intră aici.</p>
    </div>
  );
}

export default function Home() {
  const [announcements, setAnnouncements] = useState([]);
  const [latestTrack, setLatestTrack] = useState(null);
  const [live, setLive] = useState(false);
  const { playTrack, current, playing, toggle } = usePlayer();

  useEffect(() => {
    api.get("/announcements").then((r) => setAnnouncements(r.data || [])).catch(() => {});
    api.get("/tracks").then((r) => setLatestTrack((r.data || [])[0] || null)).catch(() => {});
    api.get("/live/status").then((r) => setLive(!!r.data.is_live)).catch(() => {});
  }, []);

  const isCurrent = latestTrack && current?.id === latestTrack.id;

  return (
    <div data-testid="home-page">
      {live && (
        <Link to="/live" data-testid="live-banner" className="block max-w-[1120px] mx-auto mt-4 px-4">
          <span className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#d03a45] text-white font-display font-bold text-xs tracking-widest uppercase hover:brightness-110 transition">
            <span className="w-2 h-2 rounded-full bg-white live-dot" /> LIVE ACUM — Intră în stream
          </span>
        </Link>
      )}

      {/* HERO */}
      <section className="max-w-[1120px] mx-auto px-4 pt-6 pb-2 grid lg:grid-cols-[1.25fr_.75fr] gap-7 items-end">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="eyebrow">Ediția de iarnă · 2026</div>
          <h1 className="wordmark text-[clamp(64px,13vw,168px)] my-4 select-none" data-testid="hero-wordmark">
            BIOXIC<span className="snowcap" aria-hidden="true">BIOXIC</span>
          </h1>
          <p className="text-[clamp(17px,1.8vw,20px)] max-w-[34ch]" data-testid="hero-lede">
            Manele, remixuri și mashup-uri. Piesele care <b className="text-[#f3c46a] font-semibold">nu mai sunt pe YouTube</b> le găsești aici, în seif.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-6">
            <Link to="/muzica" data-testid="hero-listen-button" className="btn-x gold">
              <Play size={16} fill="currentColor" /> Ascultă exclusivele
            </Link>
            <Link to="/contact" data-testid="hero-booking-button" className="btn-x">Colaborări &amp; booking</Link>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.55 }}>
          <ChristmasCountdown />
        </motion.div>
      </section>

      {/* STATISTICI + COLABORĂRI */}
      <section className="max-w-[1120px] mx-auto px-4 mt-9">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            ["~50M", "vizualizări în total", "stat-total"],
            ["5M", "„Sună și mergem” · mashup TikTok", "stat-mashup"],
            ["3", "meserii: artist, textier, video", "stat-jobs"],
          ].map(([v, l, tid], i) => (
            <div key={tid} className={`glass p-5 ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`} data-testid={tid}>
              <b className="block font-display font-extrabold text-2xl">{v}</b>
              <span className="text-[#9db3a8] text-[13px]">{l}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-4" aria-label="Colaborări" data-testid="collab-chips">
          {COLLABS.map((c) => <span key={c} className="chip-x">{c}</span>)}
        </div>
      </section>

      {/* NOUTĂȚI + EXCLUSIV */}
      <section className="max-w-[1120px] mx-auto px-4 mt-14 grid lg:grid-cols-[1.1fr_.9fr] gap-5 items-start">
        <div className="grid gap-3.5">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <div className="eyebrow flex items-center gap-2"><Megaphone size={12} /> Live din studio</div>
              <h2 className="font-display font-extrabold text-[clamp(22px,3.2vw,32px)]">Noutăți</h2>
            </div>
          </div>
          <div className="grid gap-3" data-testid="announcements-feed">
            {announcements.length === 0 && (
              <div className="glass p-7 border-dashed" data-testid="no-announcements">
                <h3 className="font-semibold text-base">Încă nicio postare</h3>
                <p className="text-[#9db3a8] text-sm mt-1">Când BIOXIC postează ceva nou, apare aici pe loc, fără refresh.</p>
              </div>
            )}
            {announcements.map((a, i) => (
              <motion.article key={a.id} data-testid={`announcement-${a.id}`}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="glass p-5 grid gap-2">
                <div className="flex items-center gap-2.5 font-mono-x text-[11px] tracking-[0.08em] uppercase text-[#6c8378]">
                  <span className="badge-x" data-testid={`announcement-badge-${a.id}`}>Anunț</span>
                  <span>{new Date(a.created_at).toLocaleDateString("ro-RO")}</span>
                </div>
                <h3 className="font-display font-bold text-base">{a.title}</h3>
                <p className="text-sm text-[#9db3a8] whitespace-pre-wrap">{a.text}</p>
              </motion.article>
            ))}
          </div>
        </div>

        <div className="grid gap-3.5">
          <div>
            <div className="eyebrow">Ultima din seif</div>
            <h2 className="font-display font-extrabold text-[clamp(22px,3.2vw,32px)]">Exclusiv</h2>
          </div>
          {latestTrack ? (
            <div className="glass frost-edge p-5 flex items-center gap-4" data-testid="latest-track-card">
              <button
                data-testid="latest-track-play"
                onClick={() => (isCurrent ? toggle() : playTrack(latestTrack, [latestTrack]))}
                className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 group"
                aria-label={`Redă ${latestTrack.title}`}>
                {latestTrack.cover_url ? (
                  <img src={mediaUrl(latestTrack.cover_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full grid place-items-center font-display font-black text-lg" style={{ background: "conic-gradient(from 210deg,#174a35,#0b2219,#3d2a0e,#174a35)" }}>B</span>
                )}
                <span className="absolute inset-0 bg-black/50 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isCurrent && playing ? <Pause size={20} fill="#f3c46a" className="text-[#f3c46a]" /> : <Play size={20} fill="#f3c46a" className="text-[#f3c46a]" />}
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <span className="badge-x" style={{ background: "var(--gold)", color: "#1d1406", boxShadow: "0 0 16px rgba(243,196,106,.45)" }}>NOU</span>
                <p className="font-semibold truncate mt-1.5">{latestTrack.title}</p>
                <p className="text-[13px] text-[#9db3a8] truncate">BIOXIC · doar aici, în seif</p>
              </div>
            </div>
          ) : (
            <div className="glass p-7 border-dashed">
              <h3 className="font-semibold text-base">Seiful e gol deocamdată</h3>
              <p className="text-[#9db3a8] text-sm mt-1">Prima piesă exclusivă urcă curând.</p>
            </div>
          )}

          <div className="eyebrow mt-2">Mă găsești și aici</div>
          <div className="grid grid-cols-2 gap-2.5">
            {SOCIALS.map((s) => (
              <a key={s.tid} href={s.href} target="_blank" rel="noopener noreferrer" data-testid={s.tid}
                className="glass p-4 grid gap-0.5 hover:border-[#f3c46a]/60 hover:-translate-y-px transition-all">
                <small className="font-mono-x text-[10px] tracking-[0.16em] uppercase text-[#6c8378] flex items-center gap-1.5"><s.icon size={11} className="text-[#f3c46a]" /> {s.small}</small>
                <b className="font-semibold text-sm break-all">{s.big}</b>
              </a>
            ))}
          </div>
          <DiscordButton tid="home-discord" compact />
        </div>
      </section>

      {/* CITAT */}
      <section className="max-w-[1120px] mx-auto px-4 mt-16">
        <div className="glass frost-edge p-10 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 0%, rgba(243,196,106,0.08) 0%, transparent 60%)" }} />
          <p className="relative font-display text-xl sm:text-3xl font-bold leading-snug" data-testid="guta-quote">
            „Un tinerel în curs de <span className="text-[#f3c46a] text-glow">perfeționare</span>"
          </p>
          <p className="relative mt-4 font-mono-x text-[11px] tracking-[0.3em] uppercase text-[#6c8378]">— Nicolae Guță</p>
        </div>
      </section>

      {/* CTA LIVE */}
      <section className="max-w-[1120px] mx-auto px-4 mt-10">
        <Link to="/live" data-testid="home-live-cta" className="glass frost-edge block p-8 sm:p-12 group hover:border-[#f3c46a]/50 transition-colors relative overflow-hidden">
          <div className="absolute inset-0 opacity-60" style={{ background: "linear-gradient(90deg, rgba(243,196,106,0.08), transparent)" }} />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="eyebrow flex items-center gap-2 mb-3"><Radio size={13} /> BIOXIC Live</p>
              <h3 className="font-display font-bold text-xl sm:text-2xl">Stream-uri live, chat cu fanii, cereri de piese</h3>
            </div>
            <span className="btn-x gold whitespace-nowrap">Intră pe Live</span>
          </div>
        </Link>
      </section>
    </div>
  );
}
