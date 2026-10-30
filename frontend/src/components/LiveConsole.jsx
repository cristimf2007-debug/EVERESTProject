import React, { useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Volume2, Square, Loader2, Users, TriangleAlert, Maximize2 } from "lucide-react";
import { useRadio } from "@/context/RadioContext";
import { mediaUrl } from "@/lib/api";
import Equalizer from "@/components/Equalizer";
import LiveChat from "@/components/LiveChat";
import ShareButton from "@/components/ShareButton";
import LiveWave from "@/components/LiveWave";
import Vinyl from "@/components/Vinyl";
import PlayKnob from "@/components/PlayKnob";

function fmt(sec) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Consola live: vinyl + controale + chat + coada de rotație (secțiunea Live din Muzică)
export default function LiveConsole() {
  const { liveInfo, current, mode, status, playing, progress, duration, volume, listeners, queue, toggle, stop, setVolume } = useRadio();
  const haloRef = useRef(null);
  const ringRef = useRef(null);

  const track = liveInfo?.track;
  const next = liveInfo?.next;
  const onAir = mode === "live" && current;
  const pct = duration ? Math.min(1, progress / duration) : 0;

  // halo + inel care pulsează pe bas — mutare directă în DOM, fără re-render
  const onLevel = useCallback((level) => {
    const el = haloRef.current;
    if (el) {
      el.style.opacity = String(0.3 + level * 0.7);
      el.style.transform = `scale(${1 + level * 0.12})`;
    }
    const ring = ringRef.current;
    if (ring) ring.style.filter = `drop-shadow(0 0 ${6 + level * 12}px rgba(45,216,240,${0.5 + level * 0.5}))`;
  }, []);

  if (!track) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8 py-6">
        <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-stretch">
          <div className="ob-card p-10 sm:p-16 text-center" data-testid="radio-empty">
            <Loader2 size={34} className="mx-auto text-[var(--flame)] mb-5 animate-spin" />
            <h2 className="font-display text-2xl sm:text-3xl uppercase">Radio-ul pornește curând</h2>
            <p className="text-[var(--text-2)] mt-3 text-sm sm:text-base">
              Prima piesă se încarcă în rotație. Revino peste câteva minute — după asta, cântă non-stop, 24/7.
            </p>
          </div>
          {/* chatul nu așteaptă radioul — se conectează imediat */}
          <LiveChat />
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-8 py-6 sm:py-8" data-testid="live-console">
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 items-stretch">
        <div className="ob-card p-6 sm:p-9">
          <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-9 md:gap-11 items-center h-full">
            {/* vinyl realist */}
            <div className="relative mx-auto w-60 sm:w-72 md:w-full max-w-sm">
              <div
                ref={haloRef}
                aria-hidden="true"
                className="absolute -inset-10 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(45,216,240,.22), transparent 65%)", opacity: 0.3 }}
              />
              <Vinyl cover={track.cover_url} title={track.title} spinning={playing && !!onAir} />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2">
                <Equalizer playing={playing && !!onAir} bars={7} color="var(--live)" />
              </div>
            </div>

            {/* panou live */}
            <div aria-live="polite">
              <div className="flex flex-wrap items-center gap-3">
                <span data-testid="live-status-pill" className="flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-mono-x font-semibold uppercase tracking-[0.2em] border border-[rgba(var(--live-rgb),.5)] text-[var(--live)] text-glow-live">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--live)] live-dot" />
                  Live · 24/7
                </span>
                <span data-testid="live-listeners" className="flex items-center gap-1.5 text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-2)]">
                  <Users size={12} /> {listeners} {listeners === 1 ? "ascultător" : "ascultători"}
                </span>
              </div>

              <p className="badge-engraved mt-6" data-testid="now-playing-label">Acum la radio</p>
              <h2 data-testid="now-playing-title" className="font-display text-2xl sm:text-3xl lg:text-4xl uppercase mt-2 leading-[1.05]">{track.title}</h2>
              <p className="text-[11px] font-mono-x uppercase tracking-widest text-[var(--text-2)] mt-2">{track.artist || "BIOXIC"}</p>

              <div className="mt-5" data-testid="live-progress">
                <LiveWave onLevel={onLevel} />
              </div>
              <div className="flex justify-between text-[10px] font-mono-x text-[var(--text-3)] mt-1.5">
                <span data-testid="live-position">{onAir ? fmt(progress) : "--:--"}</span>
                <span>{fmt(duration || track.duration)}</span>
              </div>

              {/* transport: knob de play cu inel de progres + stop + volum steel */}
              <div className="flex flex-wrap items-center gap-4 mt-6" data-testid="now-playing-card">
                <PlayKnob pct={pct} playing={playing} loading={status === "loading"} onToggle={toggle} ringRef={ringRef} />
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      data-testid="radio-stop-button"
                      onClick={stop}
                      disabled={status === "idle" || status === "stopped"}
                      aria-label="Stop"
                      className="knob"
                    >
                      <Square size={14} fill="currentColor" />
                    </button>
                    <ShareButton track={track} testid="live-share" />
                    <Link to="/live" className="knob" aria-label="Deschide camera live full-screen" data-testid="open-live-room" title="Camera live">
                      <Maximize2 size={14} />
                    </Link>
                  </div>
                  <div className="flex items-center gap-2.5 w-36">
                    <Volume2 size={14} className="text-[var(--text-3)] shrink-0" />
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
              </div>

              {next && next.id !== track.id && (
                <p className="text-xs text-[var(--text-2)] mt-5" data-testid="up-next">
                  Urmează: <span className="text-[var(--text)] font-semibold">{next.title}</span>
                </p>
              )}
              {status === "error" && (
                <p className="flex items-center gap-2 text-xs text-[var(--live)] mt-3" data-testid="radio-error">
                  <TriangleAlert size={13} /> Conexiunea a picat — apasă din nou play.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* chat — panou de sticlă pe desktop, bottom sheet pe mobil */}
        <LiveChat />
      </div>

      {/* coada radioului */}
      {queue.length > 0 && (
        <div className="mt-6" data-testid="radio-queue">
          <p className="badge-engraved mb-4">În rotație · {queue.length} piese</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {queue.map((q, i) => {
              const isNow = q.id === track.id;
              return (
                <div
                  key={q.id}
                  data-testid={`queue-item-${q.id}`}
                  className={`queue-row w-full min-w-0 overflow-hidden flex items-center gap-3 rounded-2xl px-3.5 py-3 border ${isNow ? "border-[rgba(var(--live-rgb),.45)] bg-[rgba(var(--live-rgb),.06)]" : "border-[var(--edge)] glass"}`}
                >
                  <span className={`font-display text-base font-bold w-7 text-right shrink-0 ${isNow ? "text-[var(--live)]" : "text-[var(--text-3)]"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <img src={mediaUrl(q.cover_url) || "/logo-alt.png"} alt="" className={`w-10 h-10 object-cover shrink-0 ${isNow ? "rounded-full vinyl-spin" : "rounded-xl"}`} loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{q.title}</p>
                    <p className="text-[9px] font-mono-x uppercase tracking-widest text-[var(--text-3)]">{q.artist || "BIOXIC"}</p>
                  </div>
                  {isNow ? (
                    <span className="flex items-center gap-2 shrink-0 text-[9px] font-mono-x font-semibold uppercase tracking-widest text-[var(--flame)]">
                      <Equalizer playing={playing} bars={4} color="var(--flame)" className="h-3.5" /> Acum
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono-x text-[var(--text-3)] shrink-0">{q.duration ? fmt(q.duration) : ""}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
