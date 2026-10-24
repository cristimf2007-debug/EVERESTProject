import React, { useEffect, useMemo, useState } from "react";
import { ListMusic, Play, Shuffle } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";

function fmtTotal(sec) {
  if (!sec) return "";
  const m = Math.round(sec / 60);
  return `${m} min`;
}

// Playlisturi — carduri cu mozaic de covere; cover flow 3D vine în faza următoare
export default function Playlisturi() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useRadio();

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

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 gap-6" data-testid="playlisturi-loading">
        {[0, 1].map((i) => <div key={i} className="glass rounded-2xl aspect-[4/3] animate-pulse" />)}
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="ob-card p-14 text-center" data-testid="playlisturi-empty">
        <ListMusic size={32} className="mx-auto text-[var(--flame)] mb-4" />
        <p className="font-display text-xl uppercase">Niciun playlist încă</p>
        <p className="text-[var(--text-2)] text-sm mt-2">Playlisturile apar când piesele sunt grupate la upload.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-6" data-testid="playlisturi-grid">
      {groups.map(([name, list], gi) => {
        const covers = list.filter((t) => t.cover_url).slice(0, 4);
        const total = list.reduce((s, t) => s + (t.duration || 0), 0);
        const shufflePlay = () => {
          const shuffled = [...list].sort(() => Math.random() - 0.5);
          playTrack(shuffled[0], shuffled);
        };
        return (
          <article key={name} className={`ob-card p-5 rv ${gi % 2 ? "rv-d1" : ""}`} data-testid={`playlist-card-${name}`}>
            <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden aspect-square max-w-[240px]">
              {(covers.length ? covers : [null]).slice(0, 4).map((t, i) => (
                <img
                  key={i}
                  src={t ? mediaUrl(t.cover_url) : "/logo-alt.png"}
                  alt=""
                  loading="lazy"
                  className={`w-full h-full ${t ? "object-cover" : "object-contain p-4"} ${covers.length === 1 ? "col-span-2 row-span-2" : ""}`}
                  style={{ background: "var(--obsidian-2)", aspectRatio: "1/1" }}
                />
              ))}
            </div>
            <h3 className="font-display text-lg uppercase mt-4 leading-tight">{name}</h3>
            <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)] mt-1.5">
              {list.length} {list.length === 1 ? "piesă" : "piese"}{total ? ` · ${fmtTotal(total)}` : ""}
            </p>
            <div className="flex items-center gap-2.5 mt-4">
              <button
                className="btn-flame !h-10 !px-5 !text-[10px]"
                onClick={() => list[0] && playTrack(list[0], list)}
                data-testid={`playlist-play-${name}`}
              >
                <Play size={13} fill="currentColor" /> Redă
              </button>
              <button className="knob knob-sm" onClick={shufflePlay} aria-label={`Redă aleatoriu ${name}`} data-testid={`playlist-shuffle-${name}`}>
                <Shuffle />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
