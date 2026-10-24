import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, Play, Eye, Search, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";

const CATS = [
  { k: "toate", label: "Toate" },
  { k: "seif", label: "Clipuri BIOXIC" },
  { k: "everest", label: "Everest Manele" },
];
const BADGE = {
  everest: "EVEREST",
  seif: "SEIF",
};

const catOf = (v) => (v.uploaded ? "seif" : "everest");

const fmtDate = (iso) => {
  const t = Date.parse(iso || "");
  if (!t) return "";
  return new Date(t).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// Player YouTube oficial (embed) — o singură instanță, pune pauză radioului cât rulează
function YTModal({ video, onClose }) {
  const { pause } = useRadio();
  useEffect(() => {
    pause(); // niciodată două surse audio simultan
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [pause]);
  return (
    <div
      className="fixed inset-0 z-[150] grid place-items-center px-3 pb-24"
      style={{ background: "rgba(7,9,14,.88)", backdropFilter: "blur(12px)" }}
      data-testid="yt-modal"
      onClick={onClose}
    >
      <div className="ob-card w-full max-w-3xl p-3 sm:p-4" onClick={(e) => e.stopPropagation()} style={{ animation: "player-rise .35s cubic-bezier(.2,.9,.25,1.15) both" }}>
        <div className="flex items-center justify-between gap-3 px-1 pb-3">
          <p className="text-sm font-semibold truncate">{video.title}</p>
          <div className="flex items-center gap-2 shrink-0">
            <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer" className="knob knob-sm" aria-label="Deschide pe YouTube" data-testid="yt-open-external">
              <ExternalLink />
            </a>
            <button onClick={onClose} className="knob knob-sm" aria-label="Închide playerul" data-testid="yt-close"><X /></button>
          </div>
        </div>
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[var(--edge)]">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            data-testid="yt-iframe"
          />
        </div>
        <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)] mt-3 px-1">
          Redare prin playerul oficial YouTube · {video.channel || "Everest Manele"}
        </p>
      </div>
    </div>
  );
}
function ChannelCard({ v, onPlayYt }) {
  const cat = catOf(v);
  const inner = (
    <>
      <span className="relative block aspect-video overflow-hidden rounded-xl bg-black">
        {v.uploaded && !v.thumb_url ? (
          <video
            src={`${mediaUrl(v.video_url)}#t=0.5`}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <img
            src={v.uploaded ? mediaUrl(v.thumb_url) : v.thumbnail}
            alt={v.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        )}
        <span className="ytc-badge">{BADGE[cat]}</span>
        <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(3,8,5,.34)" }}>
          <span className="knob !w-12 !h-12" style={{ color: "var(--flame)" }}>
            {v.uploaded ? <Play size={17} fill="currentColor" className="ml-0.5" /> : <ExternalLink size={16} />}
          </span>
        </span>
      </span>
      <span className="block mt-2.5 px-0.5">
        <span className="block text-[13px] font-semibold leading-snug line-clamp-2">{v.title}</span>
        <span className="block text-[9.5px] font-mono-x uppercase tracking-[0.14em] text-[var(--text-3)] mt-1.5">
          {v.uploaded ? (
            <span className="flex items-center gap-1.5"><Eye size={10} /> {v.views || 0} vizualizări · BIOXIC</span>
          ) : (
            <>{fmtDate(v.published)}{v.channel ? ` · ${v.channel}` : ""}</>
          )}
        </span>
      </span>
    </>
  );
  const cls = "ytc-card group text-left";
  if (v.uploaded) {
    return <Link to={`/clipuri/${v.id}`} className={cls} data-testid={`video-card-${v.id}`} data-cursor="PLAY">{inner}</Link>;
  }
  return (
    <button type="button" onClick={() => onPlayYt(v)} className={cls} data-testid={`yt-card-${v.id}`} data-cursor="PLAY" aria-label={`Redă ${v.title}`}>
      {inner}
    </button>
  );
}

// Rând orizontal de canal cu săgeți — ca pe YouTube, dar în sticlă obsidian
function ChannelRow({ cat, items, onPlayYt }) {
  const rowRef = useRef(null);
  const scroll = (dir) => rowRef.current?.scrollBy({ left: dir * 620, behavior: "smooth" });
  const meta = CATS.find((c) => c.k === cat);
  return (
    <section className="mt-10" data-testid={`yt-row-${cat}`}>
      <div className="flex items-center justify-between gap-3 px-1">
        <h3 className="font-display text-base sm:text-lg uppercase tracking-tight">
          {meta.label} <span className="text-[var(--flame)] font-mono-x text-xs">({items.length})</span>
        </h3>
        <div className="hidden sm:flex items-center gap-1.5">
          <button className="knob knob-sm" onClick={() => scroll(-1)} aria-label={`Derulează stânga ${meta.label}`} data-testid={`yt-left-${cat}`}><ChevronLeft /></button>
          <button className="knob knob-sm" onClick={() => scroll(1)} aria-label={`Derulează dreapta ${meta.label}`} data-testid={`yt-right-${cat}`}><ChevronRight /></button>
        </div>
      </div>
      <div ref={rowRef} className="ytc-row chat-scroll mt-4" data-lenis-prevent>
        {items.map((v) => <ChannelCard key={`${v.uploaded ? "up" : "yt"}-${v.id}`} v={v} onPlayYt={onPlayYt} />)}
      </div>
    </section>
  );
}

// Video — canalul BIOXIC × Everest Manele: filtre, căutare, rânduri orizontale
export default function Videoclipuri() {
  const [uploads, setUploads] = useState([]);
  const [yt, setYt] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("toate");
  const [q, setQ] = useState("");
  const [ytPlay, setYtPlay] = useState(null); // clipul YouTube deschis în playerul embed

  useEffect(() => {
    Promise.all([
      api.get("/videos").catch(() => ({ data: [] })),
      api.get("/youtube/videos").catch(() => ({ data: [] })),
    ]).then(([up, y]) => {
      setUploads((up.data || []).map((v) => ({ ...v, uploaded: true })));
      // de pe YouTube luăm DOAR canalul Everest Manele — canalul BIOXIC rămâne pe YouTube
      setYt((y.data || []).filter((v) => v.channel === "Everest Manele"));
      setLoading(false);
    });
  }, []);

  const all = useMemo(() => [...uploads, ...yt], [uploads, yt]);
  const byCat = useMemo(() => {
    const map = {};
    for (const v of all) {
      const c = catOf(v);
      (map[c] = map[c] || []).push(v);
    }
    return map;
  }, [all]);

  const query = q.trim().toLowerCase();
  const match = (v) => !query || v.title.toLowerCase().includes(query);

  const totalShown = all.filter(match).length;
  const seifItems = (byCat.seif || []).filter(match);
  const everestItems = (byCat.everest || []).filter(match);

  return (
    <div data-testid="clipuri-page" className="max-w-[1240px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
      <header className="rv">
        <p className="badge-engraved">YouTube · BIOXIC × Everest Manele</p>
        <h2 className="font-display text-4xl sm:text-6xl uppercase tracking-tight mt-2">
          Videoclipuri<span className="text-[var(--flame)]">.</span>
        </h2>
      </header>

      {/* filtre + căutare */}
      <div className="flex flex-wrap items-center gap-2 mt-7 rv" data-testid="yt-filters">
        {CATS.filter((c) => c.k === "toate" || (byCat[c.k] || []).length > 0).map((c) => (
          <button
            key={c.k}
            data-testid={`yt-filter-${c.k}`}
            onClick={() => setCat(c.k)}
            className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors border ${
              cat === c.k
                ? "border-transparent text-[#07090e]"
                : "border-[var(--edge)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--edge-hi)]"
            }`}
            style={cat === c.k ? { background: "linear-gradient(180deg, var(--flame), var(--flame-deep))" } : {}}
          >
            {c.label}{c.k !== "toate" ? ` (${(byCat[c.k] || []).length})` : ""}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64 mt-2 sm:mt-0">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
          <input
            data-testid="yt-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Caută (Guță, Maxim…)"
            className="input-recessed !rounded-full w-full pl-9 pr-4 py-2.5 text-xs outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-6 mt-10">
          {[0, 1].map((i) => <div key={i} className="glass rounded-2xl aspect-video animate-pulse" />)}
        </div>
      ) : totalShown === 0 ? (
        <div className="ob-card p-14 text-center mt-10" data-testid="clipuri-empty">
          <Clapperboard size={32} className="mx-auto text-[var(--flame)] mb-4" />
          <p className="font-display text-xl uppercase">Niciun clip găsit</p>
          <p className="text-[var(--text-2)] text-sm mt-2">{query ? `Nimic pentru „${q}”. Încearcă alt cuvânt.` : "Primul videoclip urcă în curând."}</p>
        </div>
      ) : cat === "toate" ? (
        <>
          {/* clipurile încărcate de BIOXIC — playerul intern, interfață de tip YouTube */}
          {seifItems.length > 0 && (
            <section className="mt-10" data-testid="yt-row-seif">
              <h3 className="font-display text-base sm:text-lg uppercase tracking-tight px-1">
                Clipuri <span className="text-[var(--flame)]">BIOXIC</span> <span className="text-[var(--flame)] font-mono-x text-xs">({seifItems.length})</span>
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-4">
                {seifItems.map((v) => <ChannelCard key={`up-${v.id}`} v={v} onPlayYt={setYtPlay} />)}
              </div>
            </section>
          )}
          {/* mai jos: doar canalul Everest Manele de pe YouTube — player embed oficial, direct pe site */}
          {everestItems.length > 0 && <ChannelRow cat="everest" items={everestItems} onPlayYt={setYtPlay} />}
        </>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-8" data-testid="yt-grid">
          {(byCat[cat] || []).filter(match).map((v) => <ChannelCard key={`${v.uploaded ? "up" : "yt"}-${v.id}`} v={v} onPlayYt={setYtPlay} />)}
        </div>
      )}

      {ytPlay && <YTModal video={ytPlay} onClose={() => setYtPlay(null)} />}
    </div>
  );
}
