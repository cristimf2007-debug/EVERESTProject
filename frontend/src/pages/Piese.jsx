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

function TrackRow({ t, i }) {
  const { current, mode, playing, playTrack, toggle } = useRadio();
  const isCurrent = current?.id === t.id;
  const isPlayingThis = isCurrent && playing;
  // dacă piesa e cea de pe radio, clickul intră în modul piesă (seek activ), nu doar pauză
  const onClick = () => (isCurrent && mode === "track" ? toggle() : playTrack(t));
  return (
    <article
      data-testid={`track-card-${t.id}`}
      className={`track-card glass rounded-2xl p-3.5 sm:p-4 flex items-center gap-4 cursor-pointer ${isCurrent && mode === "track" ? "!border-[rgba(var(--accent-rgb),.5)]" : ""}`}
      onClick={onClick}
    >
      <span className={`font-display text-xl sm:text-2xl font-black w-9 text-right shrink-0 ${isCurrent ? "text-[var(--accent)]" : "text-[var(--dim)]"}`}>
        {String(i + 1).padStart(2, "0")}
      </span>
      <div className="relative shrink-0">
        <img
          src={mediaUrl(t.cover_url) || "/logo-alt.png"}
          alt={t.title}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-[var(--line)]"
          loading="lazy"
        />
        <span className={`absolute inset-0 grid place-items-center rounded-xl transition-opacity ${isCurrent ? "opacity-100 bg-black/45" : "opacity-0 hover:opacity-100 bg-black/45"}`}>
          {isPlayingThis ? <Pause size={20} fill="#fff" className="text-white" /> : <Play size={20} fill="#fff" className="text-white ml-0.5" />}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-sm sm:text-base leading-snug truncate">{t.title}</h3>
        <p className="text-[10px] sm:text-[11px] font-mono-x uppercase tracking-widest text-[var(--mist)] mt-1">
          {t.artist || "BIOXIC"} · {t.plays || 0} redări{t.duration ? ` · ${fmt(t.duration)}` : ""}
        </p>
        {isCurrent && (
          <span className="inline-flex items-center gap-2 mt-1.5" data-testid={`track-playing-badge-${t.id}`}>
            <Equalizer playing={isPlayingThis} bars={4} className="h-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">{isPlayingThis ? "Se redă" : "Pauză"}</span>
          </span>
        )}
      </div>
      <ShareButton track={t} testid={`track-share-${t.id}`} className="shrink-0" />
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
            <div className="grid gap-3 mt-4">
              {list.map((t, i) => (
                <TrackRow key={t.id} t={t} i={i} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
