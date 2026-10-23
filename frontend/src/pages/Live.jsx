import React from "react";
import { Play, Pause, Volume2, ListMusic, Users } from "lucide-react";
import { useRadio } from "@/context/RadioContext";
import { mediaUrl } from "@/lib/api";
import Equalizer from "@/components/Equalizer";
import LiveChat from "@/components/LiveChat";
import ShareButton from "@/components/ShareButton";

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
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        {!track ? (
          <div className="glass rounded-2xl p-10 sm:p-16 text-center max-w-2xl mx-auto" data-testid="radio-empty">
            <ListMusic size={40} className="mx-auto text-[var(--accent)] mb-5" />
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase">Radio-ul pornește curând</h2>
            <p className="text-[var(--mist)] mt-3 text-sm sm:text-base">
              Prima piesă se încarcă în rotație. Revino peste câteva minute — după asta, cântă non-stop, 24/7.
            </p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-14 items-center">
              {/* cover tip vinyl */}
              <div className="relative mx-auto w-64 sm:w-80 lg:w-full max-w-sm">
                <div className={`rounded-full overflow-hidden border-2 border-[var(--line-hi)] cover-glow ${playing && onAir ? "vinyl-spin" : "vinyl-spin vinyl-paused"}`}>
                  <img
                    src={mediaUrl(track.cover_url) || "/logo-alt.png"}
                    alt={track.title}
                    data-testid="live-cover"
                    className="w-full aspect-square object-cover"
                  />
                </div>
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <span className="w-14 h-14 rounded-full border-2 border-[var(--line-hi)]" style={{ background: "var(--night)" }} />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2">
                  <Equalizer playing={playing && !!onAir} bars={7} color="var(--berry)" />
                </div>
              </div>

              {/* panou live */}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span data-testid="live-status-pill" className="flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] border border-[rgba(var(--berry-rgb),.5)] text-[var(--berry)] text-glow-live">
                    <span className="w-2 h-2 rounded-full bg-[var(--berry)] live-dot" />
                    Live · 24/7
                  </span>
                  <span data-testid="live-listeners" className="flex items-center gap-1.5 text-[11px] font-mono-x uppercase tracking-widest text-[var(--mist)]">
                    <Users size={13} /> {listeners} {listeners === 1 ? "ascultător" : "ascultători"} acum
                  </span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-wide mt-5 leading-[1.05]">
                  Radio <span className="text-[var(--accent)] text-glow">BIOXIC</span>
                </h2>
                <p className="text-[var(--mist)] text-sm sm:text-base mt-3 max-w-lg">
                  Manele, remixuri și mashup-uri non-stop. Toți ascultătorii aud aceeași piesă, la aceeași secundă — ca la radio.
                </p>

                {/* acum la radio */}
                <div className="glass rounded-2xl p-5 sm:p-6 mt-8" data-testid="now-playing-card">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[10px] font-mono-x uppercase tracking-[0.25em] text-[var(--berry)]">Acum la radio</p>
                    <ShareButton track={track} testid="live-share" />
                  </div>
                  <p data-testid="now-playing-title" className="font-display text-xl sm:text-2xl font-bold uppercase mt-1.5 leading-tight">{track.title}</p>
                  <p className="text-[11px] font-mono-x uppercase tracking-widest text-[var(--mist)] mt-1">{track.artist || "BIOXIC"}</p>

                  <div className="h-1.5 w-full bg-black/40 rounded-full mt-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: onAir ? `${pct}%` : "0%", background: "linear-gradient(90deg, var(--berry), var(--accent))" }}
                      data-testid="live-progress"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono-x text-[var(--dim)] mt-1.5">
                    <span data-testid="live-position">{onAir ? fmt(progress) : "--:--"}</span>
                    <span>{fmt(duration || track.duration)}</span>
                  </div>

                  {next && next.id !== track.id && (
                    <p className="text-xs text-[var(--mist)] mt-4" data-testid="up-next">
                      Urmează: <span className="text-[var(--frost)] font-semibold">{next.title}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-5">
                    <button
                      data-testid="radio-play-button"
                      onClick={toggle}
                      className="btn-live flex items-center gap-2.5 rounded-full px-7 py-3.5 text-xs font-black uppercase tracking-[0.15em]"
                    >
                      {playing ? <Pause size={16} fill="#fff" /> : <Play size={16} fill="#fff" className="ml-0.5" />}
                      {playing ? "Pauză" : "Ascultă live"}
                    </button>
                    <div className="flex items-center gap-2.5 w-36">
                      <Volume2 size={15} className="text-[var(--dim)] shrink-0" />
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
                  <p className="text-[10px] font-mono-x text-[var(--dim)] mt-4 uppercase tracking-widest">
                    Sincronizat cu toți ascultătorii · fără întreruperi
                  </p>
                </div>
              </div>
            </div>

            {/* chat + playlist */}
            <div className="grid lg:grid-cols-2 gap-8 mt-14 sm:mt-16 items-start">
              <LiveChat />

              {queue.length > 0 && (
                <section data-testid="radio-queue">
                  <h3 className="font-display text-lg sm:text-xl font-extrabold uppercase tracking-wide">
                    Playlist <span className="text-[var(--accent)]">în rotație</span>
                  </h3>
                  <div className="mt-5 grid gap-2">
                    {queue.map((q, i) => {
                      const isNow = q.id === track.id;
                      return (
                        <div
                          key={q.id}
                          data-testid={`queue-item-${q.id}`}
                          className={`queue-row flex items-center gap-4 rounded-2xl px-4 py-3 border ${isNow ? "border-[rgba(var(--berry-rgb),.5)] bg-[rgba(var(--berry-rgb),.07)]" : "border-[var(--line)] glass"}`}
                        >
                          <span className={`font-display text-lg font-extrabold w-8 text-right ${isNow ? "text-[var(--berry)]" : "text-[var(--dim)]"}`}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <img src={mediaUrl(q.cover_url) || "/logo-alt.png"} alt="" className={`w-11 h-11 object-cover ${isNow ? "rounded-full vinyl-spin" : "rounded-xl"}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{q.title}</p>
                            <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--mist)]">{q.artist || "BIOXIC"}</p>
                          </div>
                          {isNow ? (
                            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--berry)]">
                              <Equalizer playing={playing} bars={4} color="var(--berry)" className="h-3.5" /> Acum
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono-x text-[var(--dim)]">{q.duration ? fmt(q.duration) : ""}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
