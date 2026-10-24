import React, { useEffect, useMemo, useState } from "react";
import { Play, Pause, Headphones, ListMusic } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";
import ShareButton from "@/components/ShareButton";
import Equalizer from "@/components/Equalizer";

function fmt(sec) {
  if (!sec || !isFinite(sec)) return "";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function TrackCard({ t }) {
  const { current, mode, playing, playTrack, toggle } = useRadio();
  const isCurrent = current?.id === t.id;
  const inTrackMode = isCurrent && mode === "track";
  const isPlayingThis = inTrackMode && playing;
  const onClick = () => (inTrackMode ? toggle() : playTrack(t));
  return (
    <article
      data-testid={`track-card-${t.id}`}
      data-cursor="PLAY"
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div
        className={`relative aspect-square rounded-2xl overflow-hidden border transition-all duration-300 ${
          inTrackMode ? "border-[rgba(var(--flame-rgb),.55)]" : "border-[var(--edge)]"
        } group-hover:-translate-y-1.5 group-hover:border-[rgba(var(--flame-rgb),.5)] group-hover:shadow-[0_18px_50px_-14px_rgba(var(--flame-rgb),.5)]`}
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.07)" }}
      >
        <img
          src={mediaUrl(t.cover_url) || "/logo-alt.png"}
          alt={t.title}
          className={`w-full h-full ${t.cover_url ? "object-cover" : "object-contain p-8"}`}
          style={{ background: "var(--obsidian-2)" }}
          loading="lazy"
        />
        <span className={`absolute inset-0 grid place-items-center transition-opacity duration-300 ${inTrackMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} style={{ background: "rgba(5,5,5,.5)" }}>
          <span className="knob !w-14 !h-14" style={{ color: "var(--flame)" }}>
            {isPlayingThis ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
          </span>
        </span>
        {t.duration && (
          <span className="absolute bottom-2.5 right-2.5 rounded-md px-2 py-0.5 text-[10px] font-mono-x bg-black/70 text-[var(--text)]">
            {fmt(t.duration)}
          </span>
        )}
        {inTrackMode && (
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1" data-testid={`track-playing-badge-${t.id}`}>
            <Equalizer playing={isPlayingThis} bars={3} className="h-2.5" />
            <span className="text-[9px] font-mono-x uppercase tracking-widest text-[var(--flame)]">{isPlayingThis ? "Se redă" : "Pauză"}</span>
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 mt-3 px-0.5">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm leading-snug truncate">{t.title}</h3>
          <p className="text-[10px] font-mono-x uppercase tracking-[0.14em] text-[var(--text-2)] mt-1">
            {t.artist || "BIOXIC"} · {t.plays || 0} redări
          </p>
        </div>
        <ShareButton track={t} testid={`track-share-${t.id}`} className="shrink-0 -mt-1" />
      </div>
    </article>
  );
}

// Piese — playlisturi tematice (grupate de admin la upload); „embedded" = secțiune în pagina Muzică
export default function Piese({ embedded = false }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("toate");

  useEffect(() => {
    api.get("/tracks")
      .then((r) => setTracks(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    for (const t of tracks) {
      const key = (t.playlist || "").trim() || "Single-uri";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return [...map.entries()];
  }, [tracks]);

  const visible = active === "toate" ? groups : groups.filter(([name]) => name === active);

  return (
    <div data-testid="piese-page" className={embedded ? "" : "max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8"}>
      {!embedded && (
        <div className="flex flex-wrap items-end justify-between gap-4 rv">
          <div>
            <p className="badge-engraved">Arhiva · Direct din seif</p>
            <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-tight mt-2">
              Piese <span className="text-[var(--flame)]">({tracks.length})</span>
            </h2>
            <p className="text-[var(--text-2)] text-sm mt-3 max-w-xl">
              Apasă play pentru ascultare individuală. Când piesa se termină, revii automat la radioul live 24/7.
            </p>
          </div>
          <span className="flex items-center gap-2 text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)]">
            <Headphones size={13} /> Calitate originală · direct din seif
          </span>
        </div>
      )}

      {/* filtre playlist */}
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-7" data-testid="playlist-filters">
          {["toate", ...groups.map(([name]) => name)].map((name) => (
            <button
              key={name}
              data-testid={`playlist-filter-${name === "toate" ? "toate" : name}`}
              onClick={() => setActive(name)}
              className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors border ${
                active === name
                  ? "border-transparent text-[#140800]"
                  : "border-[var(--edge)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--edge-hi)]"
              }`}
              style={active === name ? { background: "linear-gradient(180deg, var(--flame), var(--flame-deep))" } : {}}
            >
              {name === "toate" ? "Toate" : name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 mt-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="ob-card p-14 text-center mt-10" data-testid="piese-empty">
          <p className="font-display text-xl uppercase">Nicio piesă încă</p>
          <p className="text-[var(--text-2)] text-sm mt-2">Prima piesă urcă în curând. Revino!</p>
        </div>
      ) : (
        visible.map(([name, list]) => (
          <section key={name} className="mt-10" data-testid={`playlist-group-${name}`}>
            <h3 className="font-display text-base sm:text-lg uppercase flex items-center gap-2.5">
              <ListMusic size={17} className="text-[var(--flame)]" />
              {name}
              <span className="text-[10px] font-mono-x text-[var(--text-3)] tracking-widest">{list.length} {list.length === 1 ? "piesă" : "piese"}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mt-4">
              {list.map((t) => (
                <TrackCard key={t.id} t={t} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
