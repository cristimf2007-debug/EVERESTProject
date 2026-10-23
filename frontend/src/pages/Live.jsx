import React from "react";
import { Play, Pause, Volume2, ListMusic, Users } from "lucide-react";
import { useRadio } from "@/context/RadioContext";
import { mediaUrl } from "@/lib/api";
import Equalizer from "@/components/Equalizer";

const CROWD_BG = "https://images.pexels.com/photos/8448566/pexels-photo-8448566.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

function fmt(sec) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Live() {
  const { liveInfo, current, playing, mode, progress, duration, volume, listeners, toggle, setVolume } = useRadio();

  const track = liveInfo?.track;
  const next = liveInfo?.next;
  const queue = liveInfo?.queue || [];
  const onAir = mode === "live" && current;
  const pct = duration ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <div data-testid="live-page" className="relative">
      {/* fundal club */}
      <div className="absolute inset-x-0 top-0 h-[560px] overflow-hidden -z-10">
        <img src={CROWD_BG} alt="" className="w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,8,17,.35), var(--bg))" }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {!track ? (
          <div className="glass rounded-2xl p-10 sm:p-16 text-center max-w-2xl mx-auto" data-testid="radio-empty">
            <ListMusic size={40} className="mx-auto text-[var(--cyan)] mb-5" />
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase">Radio-ul pornește curând</h2>
            <p className="text-[var(--muted)] mt-3 text-sm sm:text-base">
              Prima piesă se încarcă în rotație. Revino peste câteva minute — după asta, cântă non-stop, 24/7.
            </p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-14 items-center">
              {/* cover uriaș tip vinyl */}
              <div className="relative mx-auto w-64 sm:w-80 lg:w-full max-w-sm">
                <div className={`rounded-full overflow-hidden border-2 border-[var(--border)] cover-glow ${playing && onAir ? "vinyl-spin" : "vinyl-spin vinyl-paused"}`}>
                  <img
                    src={mediaUrl(track.cover_url) || "/logo-alt.png"}
                    alt={track.title}
                    data-testid="live-cover"
                    className="w-full aspect-square object-cover"
                  />
                </div>
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <span className="w-14 h-14 rounded-full border-2 border-[var(--border)]" style={{ background: "var(--bg)" }} />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2">
                  <Equalizer playing={playing && !!onAir} bars={7} color="var(--live)" />
                </div>
              </div>

              {/* panou live */}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span data-testid="live-status-pill" className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] border border-[rgba(255,42,84,.5)] text-[var(--live)] text-glow-live">
                    <span className="w-2 h-2 rounded-full bg-[var(--live)] live-dot" />
                    Live · 24/7
                  </span>
                  <span data-testid="live-listeners" className="flex items-center gap-1.5 text-xs font-mono-x uppercase tracking-widest text-[var(--muted)]">
                    <Users size={13} /> {listeners} {listeners === 1 ? "ascultător" : "ascultători"} acum
                  </span>
                </div>

                <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight mt-5 leading-[0.95]">
                  Radio <span className="text-[var(--cyan)] text-glow-cyan">BIOXIC</span>
                </h2>
                <p className="text-[var(--muted)] text-sm sm:text-base mt-3 max-w-lg">
                  Manele, remixuri și mashup-uri non-stop. Toți ascultătorii aud aceeași piesă, la aceeași secundă — ca la radio.
                </p>

                {/* acum la radio */}
                <div className="glass rounded-2xl p-5 sm:p-6 mt-8" data-testid="now-playing-card">
                  <p className="text-[10px] font-mono-x uppercase tracking-[0.25em] text-[var(--live)]">Acum la radio</p>
                  <p data-testid="now-playing-title" className="font-display text-2xl sm:text-3xl font-bold uppercase mt-1.5 leading-tight">{track.title}</p>
                  <p className="text-xs font-mono-x uppercase tracking-widest text-[var(--muted)] mt-1">{track.artist || "BIOXIC"}</p>

                  <div className="h-1.5 w-full bg-slate-800/80 rounded-full mt-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: onAir ? `${pct}%` : "0%", background: "var(--live)" }}
                      data-testid="live-progress"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono-x text-[var(--faint)] mt-1.5">
                    <span data-testid="live-position">{onAir ? fmt(progress) : "--:--"}</span>
                    <span>{fmt(duration || track.duration)}</span>
                  </div>

                  {next && next.id !== track.id && (
                    <p className="text-xs text-[var(--muted)] mt-4" data-testid="up-next">
                      Urmează: <span className="text-white font-semibold">{next.title}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-5">
                    <button
                      data-testid="radio-play-button"
                      onClick={toggle}
                      className="btn-live flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-black uppercase tracking-widest"
                    >
                      {playing ? <Pause size={17} fill="#fff" /> : <Play size={17} fill="#fff" className="ml-0.5" />}
                      {playing ? "Pauză" : "Ascultă live"}
                    </button>
                    <div className="flex items-center gap-2.5 w-36">
                      <Volume2 size={15} className="text-[var(--faint)] shrink-0" />
                      <input
                        data-testid="radio-volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="vol w-full"
                        aria-label="Volum"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] font-mono-x text-[var(--faint)] mt-4 uppercase tracking-widest">
                    Sincronizat cu toți ascultătorii · fără întreruperi
                  </p>
                </div>
              </div>
            </div>

            {/* playlistul serii */}
            {queue.length > 0 && (
              <section className="mt-16 sm:mt-20" data-testid="radio-queue">
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
                  În rotație <span className="text-[var(--cyan)]">acum</span>
                </h3>
                <div className="mt-6 grid gap-2">
                  {queue.map((q, i) => {
                    const isNow = q.id === track.id;
                    return (
                      <div
                        key={q.id}
                        data-testid={`queue-item-${q.id}`}
                        className={`flex items-center gap-4 rounded-xl px-4 py-3 border ${isNow ? "border-[rgba(255,42,84,.45)] bg-[rgba(255,42,84,.06)]" : "border-[var(--border)] bg-[var(--bg2)]"}`}
                      >
                        <span className="font-mono-x text-xs text-[var(--faint)] w-6 text-right">{String(i + 1).padStart(2, "0")}</span>
                        <img src={mediaUrl(q.cover_url) || "/logo-alt.png"} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{q.title}</p>
                          <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--muted)]">{q.artist || "BIOXIC"}</p>
                        </div>
                        {isNow ? (
                          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--live)]">
                            <Equalizer playing={playing} bars={4} color="var(--live)" className="h-3.5" /> Acum
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono-x text-[var(--faint)]">{q.duration ? fmt(q.duration) : ""}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
