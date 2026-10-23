import React, { useEffect, useState } from "react";
import { Play, Pause, Headphones } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";

function fmt(sec) {
  if (!sec || !isFinite(sec)) return "";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Piese() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { current, playing, playTrack, toggle } = useRadio();

  useEffect(() => {
    api.get("/tracks")
      .then((r) => setTracks(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div data-testid="piese-page" className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight">
            Piese <span className="text-[var(--cyan)]">({tracks.length})</span>
          </h2>
          <p className="text-[var(--muted)] text-sm mt-2 max-w-xl">
            Apasă play pentru ascultare individuală. Când piesa se termină, revii automat la radioul live 24/7.
          </p>
        </div>
        <span className="flex items-center gap-2 text-[11px] font-mono-x uppercase tracking-widest text-[var(--faint)]">
          <Headphones size={13} /> Calitate originală · direct din seif
        </span>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="glass rounded-2xl p-14 text-center mt-10" data-testid="piese-empty">
          <p className="font-display text-2xl font-bold uppercase">Nicio piesă încă</p>
          <p className="text-[var(--muted)] text-sm mt-2">Prima piesă urcă în curând. Revino!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {tracks.map((t) => {
            const isCurrent = current?.id === t.id;
            const isPlayingThis = isCurrent && playing;
            return (
              <article
                key={t.id}
                data-testid={`track-card-${t.id}`}
                className="track-card glass rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => (isCurrent ? toggle() : playTrack(t))}
              >
                <div className="relative aspect-square">
                  <img src={mediaUrl(t.cover_url) || "/logo-alt.png"} alt={t.title} className="w-full h-full object-cover" loading="lazy" />
                  <div className="play-overlay absolute inset-0 grid place-items-center" style={{ background: "rgba(5,8,17,.55)" }}>
                    <span className="btn-cyan grid w-14 h-14 rounded-full place-items-center">
                      {isPlayingThis ? <Pause size={22} fill="#050811" /> : <Play size={22} fill="#050811" className="ml-1" />}
                    </span>
                  </div>
                  {isCurrent && (
                    <span className="absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-[var(--cyan)] text-[#050811]" data-testid={`track-playing-badge-${t.id}`}>
                      {isPlayingThis ? "Se redă" : "Pauză"}
                    </span>
                  )}
                  {t.duration && (
                    <span className="absolute bottom-3 right-3 rounded-md px-2 py-0.5 text-[11px] font-mono-x bg-black/70 text-white">
                      {fmt(t.duration)}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base leading-snug line-clamp-2">{t.title}</h3>
                  <p className="text-[11px] font-mono-x uppercase tracking-widest text-[var(--muted)] mt-1.5">
                    {t.artist || "BIOXIC"} · {t.plays || 0} redări
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
