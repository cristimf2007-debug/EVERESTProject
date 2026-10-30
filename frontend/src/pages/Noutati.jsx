import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, Clapperboard, Music2, Sparkles, Megaphone, ArrowRight, Eye, Youtube, Instagram, AudioLines, BadgeCheck, Heart, MessageCircle, Tv, Flame, Library, Newspaper, Users, Radio } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";
import CeENou from "@/components/CeENou";
import StoryModal from "@/components/StoryModal";
import TvBroadcast from "@/components/TvBroadcast";
import { NextPremiereCard } from "@/components/TvGuide";

const PAYPAL_URL = "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=A8F6WTGW3RU94";
const DISCORD_URL = "https://discord.gg/jhCDSq7vqu";

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

// Prima pagină — editorial de platformă muzicală: lansare în evidență, lansări, populare, clipuri, TV live, colecții
export default function Noutati() {
  const [tracks, setTracks] = useState([]);
  const [storyOpen, setStoryOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const { liveInfo } = useRadio();

  useEffect(() => {
    Promise.all([
      api.get("/tracks").catch(() => ({ data: [] })),
      api.get("/videos").catch(() => ({ data: [] })),
      api.get("/tv/schedule").catch(() => ({ data: [] })),
      fetch("/changelog.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([tr, vr, sc, cl]) => {
      setTracks(tr.data || []);
      setVideos(vr.data || []);
      setSchedule(sc.data || []);
      if (cl?.changes?.length) setChanges([{ version: cl.version, built: cl.built, changes: cl.changes }]);
      setLoading(false);
    });
  }, []);

  const latestTrack = tracks[0] || null;
  const latestReleases = tracks.slice(0, 6);
  const popular = useMemo(() => [...tracks].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 5), [tracks]);
  const recentVideos = videos.slice(0, 4);
  const collections = useMemo(() => {
    const groups = {};
    tracks.forEach((t) => {
      const key = (t.playlist || "").trim();
      if (key) (groups[key] = groups[key] || []).push(t);
    });
    return Object.entries(groups).map(([name, list]) => ({ name, list }));
  }, [tracks]);

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
      {/* ============ HERO — lansarea în evidență, editorial ============ */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 pt-10 sm:pt-16">
        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-10 items-center rv">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="sec-kicker">{latestTrack ? "Lansare în evidență" : "Everest Music"}</p>
              <Link to="/tv" className="live-badge !py-1.5 !px-3 !text-[9px]" data-testid="hero-live-badge">
                <span className="live-dot" /> TV Live · 24/7
              </Link>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-5 leading-[1.04]">
              {latestTrack ? latestTrack.title : <>Muzică direct <span className="text-[var(--flame)]">din seif</span></>}
            </h1>
            <p className="text-[var(--text-2)] text-sm sm:text-base mt-5 max-w-xl leading-relaxed">
              {latestTrack
                ? `${latestTrack.artist || "BIOXIC"} · cea mai nouă piesă din arhivă. Apasă play și o asculți chiar acum — radioul live continuă după.`
                : "Remixuri, mashup-uri și manele produse de BIOXIC — cu radio live 24/7, premiere și o comunitate care ascultă împreună."}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-7">
              {latestTrack && <HeroPlayButton track={latestTrack} list={tracks} />}
              <Link to="/muzica" className="btn-steel !h-12" data-testid="hero-explore">Explorează muzica</Link>
              {liveInfo?.listeners > 0 && (
                <span className="text-[10px] font-mono-x uppercase tracking-[0.2em] text-[var(--text-3)] inline-flex items-center gap-1.5">
                  <Radio size={11} className="text-[var(--live)]" /> {liveInfo.listeners} ascultă acum
                </span>
              )}
            </div>
          </div>
          {/* coperta piesei în evidență — mare, cu reflexie discretă */}
          {latestTrack && (
            <div className="relative rv rv-d1" data-testid="hero-cover">
              <div className="ob-card p-3 rotate-1 hover:rotate-0 transition-transform duration-500">
                <img
                  src={mediaUrl(latestTrack.cover_url) || "/logo-alt.png"}
                  alt={latestTrack.title}
                  className={`w-full aspect-square rounded-2xl ${latestTrack.cover_url ? "object-cover" : "object-contain p-14"}`}
                />
              </div>
              <div className="reflection mx-3 !h-16"><img src={mediaUrl(latestTrack.cover_url) || "/logo-alt.png"} alt="" aria-hidden="true" /></div>
            </div>
          )}
        </div>
      </section>

      {/* ============ ULTIMELE LANSĂRI ============ */}
      {latestReleases.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-16 sm:mt-20 cv-auto" data-testid="home-tracks">
          <SectionHead kicker="Proaspete din seif" title="Ultimele lansări" to="/muzica" linkLabel="Toată muzica" tid="home-tracks-all" />
          <div className="ytc-row mt-7" data-lenis-prevent>
            {latestReleases.map((t) => <HomeTrackCard key={t.id} t={t} />)}
          </div>
        </section>
      )}

      {/* ============ PIESE POPULARE ============ */}
      {popular.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-16 sm:mt-20 cv-auto" data-testid="home-popular">
          <SectionHead kicker="Cele mai ascultate" title="Piese populare" to="/muzica" linkLabel="Discografia" tid="home-popular-all" />
          <div className="ob-card mt-7 divide-y divide-[var(--edge)]">
            {popular.map((t, i) => <PopularRow key={t.id} t={t} i={i} />)}
          </div>
        </section>
      )}

      {/* ============ VIDEOCLIPURI RECENTE ============ */}
      {recentVideos.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-16 sm:mt-20 cv-auto" data-testid="home-clips">
          <SectionHead kicker="Pe ecran" title="Videoclipuri recente" to="/clipuri" linkLabel="Toate clipurile" tid="home-clips-all" />
          <div className="grid sm:grid-cols-2 gap-5 mt-7">
            {recentVideos.map((v, i) => (
              <Link key={v.id} to={`/clipuri/${v.id}`} className={`ed-card group rv rv-d${Math.min(i, 3)}`} data-testid={`home-clip-${v.id}`}>
                <span className="relative block aspect-video overflow-hidden bg-black">
                  <img src={mediaUrl(v.thumb_url) || "/logo-alt.png"} alt={v.title} loading="lazy" className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-gradient-to-t from-[rgba(4,6,11,.85)] via-transparent to-transparent" />
                  <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="knob !w-12 !h-12" style={{ color: "var(--flame)" }}><Play size={16} fill="currentColor" /></span>
                  </span>
                  <span className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="block text-sm font-semibold leading-snug line-clamp-2">{v.title}</span>
                    <span className="flex items-center gap-1.5 text-[9px] font-mono-x uppercase tracking-widest text-[var(--text-2)] mt-1.5">
                      <Eye size={10} /> {v.views || 0} vizualizări
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============ BIOXIC TV LIVE — playerul real, încastrat ============ */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-16 sm:mt-20" data-testid="home-tv">
        <SectionHead kicker="Emisiune continuă" title="BIOXIC TV — live acum" to="/tv" linkLabel="Pagina TV" tid="home-tv-all" />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 mt-7 rv">
          <TvBroadcast />
          <aside className="flex flex-col gap-5">
            <NextPremiereCard schedule={schedule} />
            <div className="ob-card p-6 flex-1 flex flex-col">
              <p className="sec-kicker">Susține proiectul</p>
              <p className="text-sm text-[var(--text-2)] mt-3 leading-relaxed flex-1">
                Fiecare donație înseamnă o piesă nouă. Comunitatea e pe Discord, la o tastă distanță.
              </p>
              <div className="flex flex-col gap-2.5 mt-5">
                <a href={PAYPAL_URL} target="_blank" rel="noreferrer" className="btn-flame !h-11 w-full" data-testid="hero-paypal">
                  <Heart size={14} /> Donează · PayPal
                </a>
                <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="btn-steel !h-11 w-full" data-testid="hero-discord">
                  <MessageCircle size={14} /> Discord · BIOXIC House
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ============ ALBUME ȘI COLECȚII ============ */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-16 sm:mt-20 cv-auto" data-testid="home-collections">
        <SectionHead kicker="Arhiva organizată" title="Albume și colecții" to="/proiecte" linkLabel="Toate proiectele" tid="home-collections-all" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-7">
          {(collections.length ? collections.slice(0, 3) : []).map((c, i) => (
            <Link key={c.name} to="/proiecte" className={`ed-card group p-5 rv rv-d${Math.min(i, 3)}`} data-testid={`home-collection-${i}`}>
              <span className="grid place-items-center w-14 h-14 rounded-2xl border border-[var(--edge)] bg-black/25 mb-4" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)" }}>
                <Library size={20} className="text-[var(--flame)]" />
              </span>
              <span className="block font-display text-lg leading-tight">{c.name}</span>
              <span className="block text-[10px] font-mono-x uppercase tracking-[0.18em] text-[var(--text-3)] mt-2">{c.list.length} piese</span>
            </Link>
          ))}
          <Link to="/proiecte" className="ed-card group p-5 rv" data-testid="home-collection-all">
            <span className="grid place-items-center w-14 h-14 rounded-2xl border border-[var(--edge)] bg-black/25 mb-4" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)" }}>
              <Music2 size={20} className="text-[var(--flame)]" />
            </span>
            <span className="block font-display text-lg leading-tight">Discografia completă</span>
            <span className="block text-[10px] font-mono-x uppercase tracking-[0.18em] text-[var(--text-3)] mt-2">{tracks.length} piese · {videos.length} clipuri</span>
          </Link>
        </div>
      </section>

      {/* ============ ACCES RAPID ============ */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-16 sm:mt-20 cv-auto" data-testid="home-quick">
        <p className="sec-kicker rv">Acces rapid</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {[
            { to: "/muzica", label: "Muzică & Radio", sub: "Radioul live 24/7", icon: Music2, tid: "news-go-muzica" },
            { to: "/clipuri", label: "Videoclipuri", sub: "Clipurile oficiale", icon: Clapperboard, tid: "news-go-video" },
            { to: "/tv", label: "BIOXIC TV", sub: "Emisiune non-stop", icon: Tv, tid: "quick-tv" },
            { to: "/proiecte", label: "Proiecte", sub: "Colecții & serii", icon: Library, tid: "quick-proiecte" },
            { to: "/despre", label: "Despre BIOXIC", sub: "Povestea lui Cristi", icon: Users, tid: "quick-despre" },
            { to: "/pareri", label: "Păreri", sub: "Ce zic fanii", icon: MessageCircle, tid: "quick-pareri" },
            { to: "/contact", label: "Contact", sub: "Booking & susținere", icon: Heart, tid: "quick-contact" },
            { to: "/live", label: "Camera live", sub: "Experiența imersivă", icon: Flame, tid: "quick-live" },
          ].map((q, i) => {
            const Icon = q.icon;
            return (
              <Link key={q.to} to={q.to} className={`ob-card track-card p-5 rv rv-d${i % 3}`} data-testid={q.tid}>
                <Icon size={18} className="text-[var(--flame)]" />
                <span className="block font-semibold text-sm mt-3">{q.label}</span>
                <span className="block text-[11px] text-[var(--text-3)] mt-1">{q.sub}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ BIO — pe scurt ============ */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-16 sm:mt-24" data-testid="bio-section">
        <div className="artist-banner rv" data-testid="hero-banner">
          <img src="/artist.jpg" alt="BIOXIC — Everest Music" loading="lazy" />
          <div className="absolute bottom-0 left-0 right-0 z-10 p-6 sm:p-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="badge-engraved !text-[9px]">Artist oficial · Everest Music</p>
              <p className="font-display text-2xl sm:text-3xl mt-2">Sunet din seif.<br />Direct la oameni.</p>
            </div>
            <Link to="/despre" className="btn-steel !h-10 !px-5 !text-[10px]" data-testid="banner-about-cta">Povestea completă</Link>
          </div>
        </div>

        <div className="ob-card p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 rv mt-6" data-testid="bio-card">
          <img src="/artist.jpg" alt="BIOXIC" className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border border-[var(--edge-hi)] shrink-0" data-testid="bio-photo" />
          <div className="min-w-0 text-center sm:text-left">
            <p className="flex items-center justify-center sm:justify-start gap-2 font-display text-xl">
              Bioxic <BadgeCheck size={18} className="text-[var(--flame)]" aria-label="Cont verificat" data-testid="bio-verified" />
            </p>
            <p className="text-[10px] font-mono-x uppercase tracking-[0.2em] text-[var(--text-3)] mt-1.5">Cristi · 19 ani · Focșani · Producător</p>
            <p className="text-sm text-[var(--text-2)] leading-relaxed mt-3">
              BIOXIC — producător și artist independent (Everest Music). Remixuri, mashup-uri și manele direct din seif,
              cu colaborări alături de Nek Music, LuCash, AMMA, Big Up, Bogdan de la Ploiești, Costel Biju și Jador.
              Premierele se aud întâi aici, pe radioul live 24/7.
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
              <button onClick={() => setStoryOpen(true)} className="knob knob-sm !w-auto !rounded-full px-4 text-[9px] font-mono-x uppercase tracking-[0.2em]" aria-label="Povestea site-ului" data-testid="hero-logo">
                Povestea
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* de la ultima vizită */}
      <CeENou />

      {/* ============ FEED ============ */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-14 sm:mt-16" data-testid="news-feed">
        <header className="flex items-end justify-between gap-4 rv">
          <div>
            <p className="sec-kicker"><Newspaper size={12} /> Feed actualizat</p>
            <h2 className="sec-title mt-2.5">Ultimele mișcări</h2>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-3 mt-8">{[0, 1, 2].map((i) => <div key={i} className="glass rounded-2xl h-24 animate-pulse" />)}</div>
        ) : feed.length === 0 ? (
          <div className="ob-card p-14 text-center mt-8" data-testid="news-empty">
            <Megaphone size={30} className="mx-auto text-[var(--flame)] mb-4" />
            <p className="font-display text-xl">Nicio noutate încă</p>
            <p className="text-[var(--text-2)] text-sm mt-2">Primul anunț apare în curând.</p>
          </div>
        ) : (
          <div className="grid gap-3.5 mt-8">
            {feed.map((it, i) => <FeedRow key={`${it.kind}-${it.id}`} it={it} i={i} />)}
          </div>
        )}
      </section>

      {storyOpen && <StoryModal onClose={() => setStoryOpen(false)} />}
    </div>
  );
}

function SectionHead({ kicker, title, to, linkLabel, tid }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rv">
      <div>
        <p className="sec-kicker">{kicker}</p>
        <h2 className="sec-title mt-2.5">{title}</h2>
      </div>
      <Link to={to} className="btn-ghost rounded-full px-5 py-2.5 text-[10px] font-mono-x uppercase tracking-widest inline-flex items-center gap-2" data-testid={tid}>
        {linkLabel} <ArrowRight size={12} />
      </Link>
    </div>
  );
}

// butonul de play al hero-ului — pornește piesa în evidență
function HeroPlayButton({ track, list }) {
  const { current, mode, playing, playTrack, toggle } = useRadio();
  const isCurrent = current?.id === track.id && mode === "track";
  const isPlayingThis = isCurrent && playing;
  return (
    <button onClick={() => (isCurrent ? toggle() : playTrack(track, list))} className="btn-flame !h-12 !px-8" data-testid="hero-play" aria-label={`Redă ${track.title}`}>
      {isPlayingThis ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
      {isPlayingThis ? "Pauză" : "Ascultă acum"}
    </button>
  );
}

// rând de piesă populară — număr mare, cover, titlu, redări reale, play
function PopularRow({ t, i }) {
  const { current, mode, playing, playTrack, toggle, queue } = useRadio();
  const isCurrent = current?.id === t.id && mode === "track";
  const isPlayingThis = isCurrent && playing;
  return (
    <button
      onClick={() => (isCurrent ? toggle() : playTrack(t, queue.length ? queue : undefined))}
      className="w-full flex items-center gap-4 sm:gap-5 px-4 sm:px-6 py-4 text-left hover:bg-white/[0.03] transition-colors group"
      data-testid={`popular-row-${t.id}`}
      aria-label={`Redă ${t.title}`}
    >
      <span className="font-display font-bold text-2xl w-8 text-center tabular-nums" style={{ color: i === 0 ? "var(--flame)" : "var(--text-3)" }}>{i + 1}</span>
      <img src={mediaUrl(t.cover_url) || "/logo-alt.png"} alt="" className="w-12 h-12 rounded-xl object-cover border border-[var(--edge)]" loading="lazy" />
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-semibold truncate ${isCurrent ? "text-[var(--flame)]" : ""}`}>{t.title}</span>
        <span className="block text-[9.5px] font-mono-x uppercase tracking-[0.16em] text-[var(--text-3)] mt-0.5">{t.artist || "BIOXIC"}</span>
      </span>
      <span className="hidden sm:inline text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)] tabular-nums">{t.plays || 0} redări</span>
      <span className="knob knob-sm shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={isPlayingThis ? { opacity: 1, color: "var(--flame)" } : {}}>
        {isPlayingThis ? <Pause /> : <Play />}
      </span>
    </button>
  );
}

// card de piesă pentru banda orizontală — cover mare, play instant
function HomeTrackCard({ t }) {
  const { current, mode, playing, playTrack, toggle } = useRadio();
  const isCurrent = current?.id === t.id && mode === "track";
  const isPlayingThis = isCurrent && playing;
  return (
    <button
      onClick={() => (isCurrent ? toggle() : playTrack(t))}
      className="ytc-card ed-card group !flex-none text-left"
      data-testid={`home-track-${t.id}`}
      aria-label={`Redă ${t.title}`}
    >
      <span className="relative block aspect-square overflow-hidden bg-black rounded-t-[22px]">
        <img src={mediaUrl(t.cover_url) || "/logo-alt.png"} alt={t.title} loading="lazy" className={`w-full h-full ${t.cover_url ? "object-cover" : "object-contain p-8"}`} />
        <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "rgba(4,6,11,.4)" }}>
          <span className="tv-bigplay-btn !w-14 !h-14">
            {isPlayingThis ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </span>
        </span>
        {isPlayingThis && (
          <span className="absolute top-3 right-3 st-pill st-now"><span className="w-1.5 h-1.5 rounded-full bg-[var(--live)] live-dot" /> Cântă</span>
        )}
      </span>
      <span className="block p-4">
        <span className="block text-sm font-semibold truncate">{t.title}</span>
        <span className="block text-[9.5px] font-mono-x uppercase tracking-[0.16em] text-[var(--text-3)] mt-1.5 truncate">{t.artist || "BIOXIC"}</span>
      </span>
    </button>
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
        <h3 className="font-display text-lg mt-2">{it.title}</h3>
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
