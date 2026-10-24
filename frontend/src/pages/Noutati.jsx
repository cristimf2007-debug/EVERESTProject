import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, Loader2, Radio, Music2, Clapperboard, Sparkles, Megaphone, ArrowRight, Eye, Youtube, Instagram, AudioLines, BadgeCheck } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";
import CeENou from "@/components/CeENou";

const SOCIALS = [
  { label: "YouTube", href: "https://www.youtube.com/@djbioxic", icon: Youtube, tid: "bio-youtube" },
  { label: "TikTok", href: "https://www.tiktok.com/@bioxic.exe", icon: Music2, tid: "bio-tiktok" },
  { label: "Instagram", href: "https://www.instagram.com/crss.exe_", icon: Instagram, tid: "bio-instagram" },
  { label: "Spotify", href: "https://open.spotify.com/artist/4tlelg9L2y1OFOVpUkIiAK", icon: AudioLines, tid: "bio-spotify" },
];

function timeAgo(iso) {
  const t = Date.parse(iso || "");
  if (!t) return "";
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "acum";
  const m = Math.floor(s / 60);
  if (m < 60) return `acum ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `acum ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ieri";
  return `acum ${d} zile`;
}

// Pagina principală = NOUTĂȚI & BIOGRAFIE: logo oficial, bio, feed de anunțuri/piese/clipuri
export default function Noutati() {
  const { status, playing, toggle } = useRadio();
  const [tracks, setTracks] = useState([]);
  const [videos, setVideos] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/tracks").catch(() => ({ data: [] })),
      api.get("/videos").catch(() => ({ data: [] })),
      fetch("/changelog.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([tr, vr, cl]) => {
      setTracks(tr.data || []);
      setVideos(vr.data || []);
      if (cl?.changes?.length) setChanges([{ version: cl.version, built: cl.built, changes: cl.changes }]);
      setLoading(false);
    });
  }, []);

  // feed unificat, cel mai recent primul
  const feed = useMemo(() => {
    const items = [
      ...changes.map((c) => ({ kind: "anunt", date: c.built || "", id: `v${c.version}`, title: `Actualizare site · v${c.version}`, list: c.changes })),
      ...tracks.map((t) => ({ kind: "track", date: t.created_at, id: t.id, t })),
      ...videos.map((v) => ({ kind: "video", date: v.created_at, id: v.id, v })),
    ];
    return items.sort((a, b) => Date.parse(b.date || 0) - Date.parse(a.date || 0)).slice(0, 20);
  }, [changes, tracks, videos]);

  return (
    <div data-testid="noutati-page" className="relative">
      {/* HERO — logo oficial 3D glass, centrat, interactiv */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 pt-10 sm:pt-14 text-center">
        <img
          src="/logo.png"
          alt="BIOXIC"
          className="brand-logo-3d w-36 h-36 sm:w-48 sm:h-48 object-contain mx-auto rv"
          data-testid="hero-logo"
        />
        <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-tight mt-5 rv" data-testid="hero-title">Bioxic</h1>
        <p className="badge-engraved mt-3 rv">Everest Music · Radio live 24/7 · Limited 2026</p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7 rv">
          <button className="btn-flame" onClick={toggle} disabled={status === "loading"} data-testid="news-play-button">
            {status === "loading" ? <Loader2 size={15} className="animate-spin" />
              : playing ? <Pause size={15} fill="currentColor" />
              : <Play size={15} fill="currentColor" />}
            {status === "loading" ? "Se încarcă…" : playing ? "Pauză" : "Ascultă live"}
          </button>
          <Link to="/muzica" className="btn-steel" data-testid="news-radio-link">
            <Radio size={14} /> Muzică & Radio
          </Link>
        </div>
      </section>

      {/* BANNER — card de impact cu poza artistului, overlay obsidian */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-10 sm:mt-14 rv" data-testid="hero-banner">
        <div className="artist-banner">
          <img src="/artist.jpg" alt="BIOXIC — Everest Music" loading="eager" />
          <div className="absolute bottom-0 left-0 right-0 z-10 p-6 sm:p-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="badge-engraved !text-[9px]">Artist oficial · Everest Music</p>
              <p className="font-display text-2xl sm:text-3xl uppercase mt-2">Sunet din seif.<br />Direct la oameni.</p>
            </div>
            <Link to="/contact" className="btn-steel !h-10 !px-5 !text-[10px]" data-testid="banner-contact-cta">Booking & Contact</Link>
          </div>
        </div>
      </section>

      {/* BIO — deck oficial cu poză, badge verificat, socialuri */}
      <section className="max-w-[920px] mx-auto px-4 sm:px-8 mt-12 sm:mt-16" data-testid="bio-section">
        <div className="ob-card p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 rv" data-testid="bio-card">
          <img src="/artist.jpg" alt="BIOXIC" className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border border-[var(--edge-hi)] shrink-0" data-testid="bio-photo" />
          <div className="min-w-0 text-center sm:text-left">
            <p className="flex items-center justify-center sm:justify-start gap-2 font-display text-xl uppercase">
              Bioxic <BadgeCheck size={18} className="text-[var(--flame)]" aria-label="Cont verificat" data-testid="bio-verified" />
            </p>
            <p className="text-[10px] font-mono-x uppercase tracking-[0.2em] text-[var(--text-3)] mt-1.5">Producător · Remixuri · Manele noi</p>
            <p className="text-sm text-[var(--text-2)] leading-relaxed mt-3">
              BIOXIC — producător și artist independent (Everest Music). Remixuri, mashup-uri și manele direct din seif:
              premierele se aud întâi aici, pe radioul live 24/7, înainte de oriunde altundeva.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-4" data-testid="bio-socials">
              {SOCIALS.map((s) => {
                const Icon = s.icon;
                return (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="knob knob-sm" aria-label={s.label} title={s.label} data-testid={s.tid}>
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* de la ultima vizită */}
      <CeENou />

      {/* feed de noutăți */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-14 sm:mt-16" data-testid="news-feed">
        <header className="flex items-end justify-between gap-4 rv">
          <div>
            <p className="badge-engraved">Feed actualizat</p>
            <h2 className="font-display text-2xl sm:text-3xl uppercase mt-2">Ultimele mișcări</h2>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-3 mt-8">{[0, 1, 2].map((i) => <div key={i} className="glass rounded-2xl h-24 animate-pulse" />)}</div>
        ) : feed.length === 0 ? (
          <div className="ob-card p-14 text-center mt-8" data-testid="news-empty">
            <Megaphone size={30} className="mx-auto text-[var(--flame)] mb-4" />
            <p className="font-display text-xl uppercase">Nicio noutate încă</p>
            <p className="text-[var(--text-2)] text-sm mt-2">Primul anunț apare în curând.</p>
          </div>
        ) : (
          <div className="grid gap-3.5 mt-8">
            {feed.map((it, i) => (
              <FeedRow key={`${it.kind}-${it.id}`} it={it} i={i} />
            ))}
          </div>
        )}
      </section>

      {/* linkuri rapide */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-14 sm:mt-16 cv-auto">
        <div className="grid sm:grid-cols-2 gap-5">
          <Link to="/muzica" className="ob-card track-card p-6 flex items-center gap-5 rv" data-testid="news-go-muzica">
            <span className="knob !w-14 !h-14 shrink-0" style={{ color: "var(--flame)" }}><Music2 size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg uppercase">Muzică & Radio</span>
              <span className="block text-xs text-[var(--text-2)] mt-1">Discografia completă + radioul live 24/7.</span>
            </span>
            <ArrowRight size={16} className="text-[var(--text-3)]" />
          </Link>
          <Link to="/clipuri" className="ob-card track-card p-6 flex items-center gap-5 rv rv-d1" data-testid="news-go-video">
            <span className="knob !w-14 !h-14 shrink-0" style={{ color: "var(--flame)" }}><Clapperboard size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg uppercase">Video</span>
              <span className="block text-xs text-[var(--text-2)] mt-1">Clipurile oficiale, în playerul nostru.</span>
            </span>
            <ArrowRight size={16} className="text-[var(--text-3)]" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeedRow({ it, i }) {
  const { playTrack } = useRadio();
  const delay = i ? `rv-d${Math.min(i, 3)}` : "";

  if (it.kind === "anunt") {
    return (
      <article className={`ob-card p-5 sm:p-6 rv ${delay}`} data-testid={`news-anunt-${it.id}`}>
        <div className="flex items-center gap-2.5 text-[var(--flame)]">
          <Sparkles size={14} />
          <p className="text-[10px] font-mono-x uppercase tracking-[0.22em]">Anunț · {timeAgo(it.date) || "recent"}</p>
        </div>
        <h3 className="font-display text-lg uppercase mt-2">{it.title}</h3>
        <ul className="mt-2.5 space-y-1.5">
          {it.list.slice(0, 4).map((c) => (
            <li key={c} className="text-sm text-[var(--text-2)] flex gap-2"><span className="text-[var(--flame)]">·</span>{c}</li>
          ))}
        </ul>
      </article>
    );
  }

  if (it.kind === "track") {
    const t = it.t;
    return (
      <article className={`ob-card track-card p-4 flex items-center gap-4 rv ${delay}`} data-testid={`news-track-${t.id}`}>
        <button
          onClick={() => playTrack(t)}
          className="relative shrink-0 group rounded-xl overflow-hidden border border-[var(--edge)]"
          aria-label={`Redă ${t.title}`}
          data-testid={`news-track-play-${t.id}`}
        >
          <img src={mediaUrl(t.cover_url) || "/logo-alt.png"} alt={t.title} className="w-16 h-16 sm:w-20 sm:h-20 object-cover" loading="lazy" />
          <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={18} fill="var(--flame)" color="var(--flame)" />
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-mono-x uppercase tracking-[0.22em] text-[var(--flame)]">Piesă nouă · {timeAgo(it.date)}</p>
          <h3 className="font-semibold text-sm sm:text-base truncate mt-1">{t.title}</h3>
          <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)] mt-0.5">{t.artist || "BIOXIC"}</p>
        </div>
        <Link to="/muzica" className="btn-ghost rounded-full px-4 py-2 text-[10px] font-mono-x uppercase tracking-widest hidden sm:flex items-center gap-2 shrink-0">
          Muzică <ArrowRight size={11} />
        </Link>
      </article>
    );
  }

  const v = it.v;
  return (
    <Link to={`/clipuri/${v.id}`} className={`ob-card track-card p-4 flex items-center gap-4 rv ${delay}`} data-testid={`news-video-${v.id}`}>
      <span className="relative shrink-0 rounded-xl overflow-hidden border border-[var(--edge)]">
        <img src={mediaUrl(v.thumb_url) || "/logo-alt.png"} alt={v.title} className="w-28 sm:w-36 aspect-video object-cover" loading="lazy" />
        <span className="absolute inset-0 grid place-items-center bg-black/30">
          <Play size={18} fill="#fff" color="#fff" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-mono-x uppercase tracking-[0.22em] text-[var(--flame)]">Clip nou · {timeAgo(it.date)}</span>
        <span className="block font-semibold text-sm sm:text-base leading-snug line-clamp-2 mt-1">{v.title}</span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)] mt-1">
          <Eye size={10} /> {v.views || 0} vizualizări
        </span>
      </span>
    </Link>
  );
}
