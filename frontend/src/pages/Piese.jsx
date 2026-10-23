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
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div
        className={`relative aspect-square rounded-2xl overflow-hidden border transition-all duration-300 ${
          inTrackMode ? "border-[rgba(var(--accent-rgb),.55)]" : "border-[var(--line)]"
        } group-hover:-translate-y-1.5 group-hover:border-[rgba(var(--accent-rgb),.5)] group-hover:shadow-[0_18px_50px_-14px_rgba(var(--accent-rgb),.5)]`}
      >
        <img
          src={mediaUrl(t.cover_url) || "/logo-alt.png"}
          alt={t.title}
          className={`w-full h-full ${t.cover_url ? "object-cover" : "object-contain p-8"}`}
          style={{ background: "var(--site-panel-2)" }}
          loading="lazy"
        />
        <span className={`absolute inset-0 grid place-items-center transition-opacity duration-300 ${inTrackMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} style={{ background: "rgba(10,8,7,.5)" }}>
          <span className="grid w-14 h-14 rounded-full place-items-center" style={{ background: "var(--site-accent)", color: "var(--site-accent-ink)", boxShadow: "0 0 26px rgba(232,115,26,.55)" }}>
            {isPlayingThis ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
          </span>
        </span>
        {t.duration && (
          <span className="absolute bottom-2.5 right-2.5 rounded-md px-2 py-0.5 text-[10px] font-mono-x bg-black/70 text-[var(--frost)]">
            {fmt(t.duration)}
          </span>
        )}
        {inTrackMode && (
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1" data-testid={`track-playing-badge-${t.id}`}>
            <Equalizer playing={isPlayingThis} bars={3} className="h-2.5" />
            <span className="text-[9px] font-mono-x uppercase tracking-widest text-[var(--accent)]">{isPlayingThis ? "Se redă" : "Pauză"}</span>
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 mt-3 px-0.5">
        <div className="min-w-0">
          <h3 className="font-bold text-sm leading-snug truncate">{t.title}</h3>
          <p className="text-[10px] font-mono-x uppercase tracking-[0.14em] text-[var(--mist)] mt-1">
            {t.artist || "BIOXIC"} · {t.plays || 0} redări
          </p>
        </div>
        <ShareButton track={t} testid={`track-share-${t.id}`} className="shrink-0 -mt-1" />
      </div>
    </article>
  );
}

// Piese — playlisturi tematice (grupate de admin la upload)
export default function Piese() {
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
    <div data-testid="piese-page" className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wide">
            Piese <span className="text-[var(--accent)]">({tracks.length})</span>
          </h2>
          <p className="text-[var(--mist)] text-sm mt-2 max-w-xl">
            Apasă play pentru ascultare individuală. Când piesa se termină, revii automat la radioul live 24/7.
          </p>
        </div>
        <span className="flex items-center gap-2 text-[10px] font-mono-x uppercase tracking-widest text-[var(--dim)]">
          <Headphones size={13} /> Calitate originală · direct din seif
        </span>
      </div>

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
                  ? "border-transparent text-[var(--on-accent)]"
                  : "border-[var(--line)] text-[var(--mist)] hover:text-[var(--frost)] hover:border-[var(--line-hi)]"
              }`}
              style={active === name ? { background: "linear-gradient(180deg, var(--accent-hi), var(--accent))" } : {}}
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
        <div className="glass rounded-2xl p-14 text-center mt-10" data-testid="piese-empty">
          <p className="font-display text-xl font-bold uppercase">Nicio piesă încă</p>
          <p className="text-[var(--mist)] text-sm mt-2">Prima piesă urcă în curând. Revino!</p>
        </div>
      ) : (
        visible.map(([name, list]) => (
          <section key={name} className="mt-10" data-testid={`playlist-group-${name}`}>
            <h3 className="font-display text-base sm:text-lg font-extrabold uppercase tracking-wide flex items-center gap-2.5">
              <ListMusic size={17} className="text-[var(--accent)]" />
              {name}
              <span className="text-[10px] font-mono-x text-[var(--dim)] tracking-widest">{list.length} {list.length === 1 ? "piesă" : "piese"}</span>
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
