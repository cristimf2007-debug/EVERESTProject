import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Library, Clapperboard, ArrowRight, Music2 } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";

// Proiecte — colecțiile lui BIOXIC: playlisturile formate din piese + canalul video
export default function Proiecte() {
  const [tracks, setTracks] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, current, playing, mode } = useRadio();

  useEffect(() => {
    Promise.all([
      api.get("/tracks").catch(() => ({ data: [] })),
      api.get("/videos").catch(() => ({ data: [] })),
    ]).then(([t, v]) => {
      setTracks(t.data || []);
      setVideos(v.data || []);
      setLoading(false);
    });
  }, []);

  // colecții reale: grupare după câmpul playlist al pieselor
  const collections = useMemo(() => {
    const groups = {};
    tracks.forEach((t) => {
      const key = (t.playlist || "").trim();
      if (key) (groups[key] = groups[key] || []).push(t);
    });
    return Object.entries(groups).map(([name, list]) => ({ name, list }));
  }, [tracks]);

  const uncategorized = useMemo(() => tracks.filter((t) => !(t.playlist || "").trim()), [tracks]);

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-10 sm:py-14" data-testid="proiecte-page">
      <header className="rv">
        <p className="sec-kicker"><Library size={12} /> Arhiva organizată</p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight mt-3">Proiecte & Colecții</h1>
        <p className="text-[var(--text-2)] text-sm sm:text-base mt-4 max-w-xl leading-relaxed">
          Piesele și clipurile lui BIOXIC, grupate pe proiecte. Apasă play pe o colecție și le asculți pe toate, în lanț.
        </p>
      </header>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-5 mt-10">{[0, 1].map((i) => <div key={i} className="glass rounded-2xl h-44 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-12 mt-10">
          {/* colecții din playlisturi */}
          {collections.map((c, ci) => (
            <section key={c.name} className="rv" data-testid={`collection-${ci}`}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="sec-kicker">Colecție</p>
                  <h2 className="font-display text-2xl sm:text-3xl mt-2">{c.name}</h2>
                  <p className="text-[10px] font-mono-x uppercase tracking-[0.2em] text-[var(--text-3)] mt-1.5">{c.list.length} piese</p>
                </div>
                <button
                  onClick={() => c.list[0] && playTrack(c.list[0], c.list)}
                  className="btn-flame !h-10 !px-5 !text-[10px]"
                  data-testid={`collection-play-${ci}`}
                  aria-label={`Redă colecția ${c.name}`}
                >
                  <Play size={13} fill="currentColor" /> Redă tot
                </button>
              </div>
              <div className="ob-card mt-5 divide-y divide-[var(--edge)]">
                {c.list.map((t, i) => {
                  const isCur = current?.id === t.id && mode === "track";
                  return (
                    <button
                      key={t.id}
                      onClick={() => playTrack(t, c.list)}
                      className="w-full flex items-center gap-4 px-4 sm:px-5 py-3.5 text-left hover:bg-white/[0.03] transition-colors group"
                      data-testid={`collection-track-${t.id}`}
                    >
                      <span className="font-mono-x text-xs text-[var(--text-3)] w-6 text-center tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      <img src={mediaUrl(t.cover_url) || "/logo-alt.png"} alt="" className="w-11 h-11 rounded-lg object-cover border border-[var(--edge)]" loading="lazy" />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold truncate ${isCur ? "text-[var(--flame)]" : ""}`}>{t.title}</span>
                        <span className="block text-[9.5px] font-mono-x uppercase tracking-[0.16em] text-[var(--text-3)] mt-0.5">{t.artist || "BIOXIC"}</span>
                      </span>
                      {isCur && playing && (
                        <span className="pb-eq shrink-0 !opacity-100 playing" style={{ color: "var(--flame)" }}><i /><i /><i /></span>
                      )}
                      <Play size={14} className="shrink-0 text-[var(--text-3)] group-hover:text-[var(--flame)] transition-colors" />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {/* piesele fără colecție */}
          {uncategorized.length > 0 && (
            <section className="rv" data-testid="collection-loose">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="sec-kicker">{collections.length ? "Singles" : "Discografie"}</p>
                  <h2 className="font-display text-2xl sm:text-3xl mt-2">{collections.length ? "Piese independente" : "Toate piesele"}</h2>
                  <p className="text-[10px] font-mono-x uppercase tracking-[0.2em] text-[var(--text-3)] mt-1.5">{uncategorized.length} piese</p>
                </div>
                <button
                  onClick={() => uncategorized[0] && playTrack(uncategorized[0], uncategorized)}
                  className="btn-steel !h-10 !px-5 !text-[10px]"
                  data-testid="collection-play-loose"
                >
                  <Play size={13} fill="currentColor" /> Redă tot
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3.5 mt-5">
                {uncategorized.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => playTrack(t, uncategorized)}
                    className="ob-card track-card p-4 flex items-center gap-4 text-left"
                    data-testid={`loose-track-${t.id}`}
                  >
                    <img src={mediaUrl(t.cover_url) || "/logo-alt.png"} alt="" className="w-14 h-14 rounded-xl object-cover border border-[var(--edge)]" loading="lazy" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate">{t.title}</span>
                      <span className="block text-[9.5px] font-mono-x uppercase tracking-[0.16em] text-[var(--text-3)] mt-1">{t.artist || "BIOXIC"}</span>
                    </span>
                    <Music2 size={15} className="text-[var(--text-3)] shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* colecția video */}
          {videos.length > 0 && (
            <section className="rv" data-testid="collection-video">
              <p className="sec-kicker"><Clapperboard size={12} /> Canal video</p>
              <h2 className="font-display text-2xl sm:text-3xl mt-2">Videoclipuri oficiale</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                {videos.slice(0, 6).map((v) => (
                  <Link key={v.id} to={`/clipuri/${v.id}`} className="ed-card group" data-testid={`collection-video-${v.id}`}>
                    <span className="relative block aspect-video overflow-hidden bg-black">
                      <img src={mediaUrl(v.thumb_url) || "/logo-alt.png"} alt={v.title} loading="lazy" className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-gradient-to-t from-[rgba(4,6,11,.85)] via-transparent to-transparent" />
                      <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="knob !w-11 !h-11" style={{ color: "var(--flame)" }}><Play size={15} fill="currentColor" /></span>
                      </span>
                      <span className="absolute bottom-0 left-0 right-0 p-3.5">
                        <span className="block text-[13px] font-semibold leading-snug line-clamp-2">{v.title}</span>
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
              <div className="mt-6">
                <Link to="/clipuri" className="btn-ghost rounded-full px-5 py-2.5 text-[10px] font-mono-x uppercase tracking-widest inline-flex items-center gap-2" data-testid="collection-video-all">
                  Toate cele {videos.length} clipuri <ArrowRight size={12} />
                </Link>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
